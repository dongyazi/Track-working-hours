const { formatDate } = require('../../utils/util')
const storageService = require('../../services/storage')

Page({
  data: {
    dimension: 'duration', // duration, income
    period: 'week', // week, month, year
    summary: {
      totalDuration: 0,
      totalIncome: 0,
      compareText: '+0%'
    },
    barChartData: [], // { label, value, height }
    projectDistribution: [], // { name, color, percentage, value }
  },

  onShow() {
    this.loadStats()
  },

  onDimensionChange(e) {
    const dimension = e.currentTarget.dataset.dimension
    this.setData({ dimension })
    this.loadStats()
  },

  onPeriodChange(e) {
    const period = e.currentTarget.dataset.period
    this.setData({ period })
    this.loadStats()
  },

  loadStats() {
    const { period, dimension } = this.data
    const now = new Date()
    let startDate, endDate
    let labels = []
    let dateRange = []

    if (period === 'week') {
      const day = now.getDay() || 7
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
      startDate = formatDate(start)
      endDate = formatDate(now)
      
      labels = ['一', '二', '三', '四', '五', '六', '日']
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        dateRange.push(formatDate(d))
      }
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate = formatDate(start)
      endDate = formatDate(now)
      
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= lastDay; i++) {
        labels.push(i.toString())
        dateRange.push(formatDate(new Date(now.getFullYear(), now.getMonth(), i)))
      }
    } else if (period === 'year') {
      startDate = `${now.getFullYear()}-01-01`
      endDate = `${now.getFullYear()}-12-31`
      labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    }

    const records = storageService.getRecords({ startDate, endDate })
    
    // 计算汇总数据
    let totalDuration = 0
    let totalIncome = 0
    const projectMap = {}

    records.forEach(r => {
      const d = parseFloat(r.duration || 0)
      totalDuration += d
      
      // 这里暂时取项目的时薪，如果记录里没存的话
      const projects = storageService.getProjects()
      const project = projects.find(p => p.id === r.projectId)
      const rate = project ? project.hourlyRate : 0
      totalIncome += d * rate

      if (!projectMap[r.projectId]) {
        projectMap[r.projectId] = {
          name: r.projectName,
          color: r.projectColor,
          value: 0
        }
      }
      projectMap[r.projectId].value += (dimension === 'duration' ? d : d * rate)
    })

    // 处理柱状图数据
    let chartValues = []
    if (period === 'year') {
      chartValues = new Array(12).fill(0)
      records.forEach(r => {
        const month = new Date(r.startTime).getMonth()
        const d = parseFloat(r.duration || 0)
        const rate = 35 // 默认
        chartValues[month] += (dimension === 'duration' ? d : d * rate)
      })
    } else {
      chartValues = new Array(dateRange.length).fill(0)
      records.forEach(r => {
        const date = r.startTime.split(' ')[0]
        const idx = dateRange.indexOf(date)
        if (idx !== -1) {
          const d = parseFloat(r.duration || 0)
          const rate = 35 // 默认
          chartValues[idx] += (dimension === 'duration' ? d : d * rate)
        }
      })
    }

    const maxValue = Math.max(...chartValues, 1)
    const barChartData = chartValues.map((v, i) => ({
      label: labels[i],
      value: v,
      height: (v / maxValue * 100) + '%'
    }))

    // 处理项目分布
    const totalVal = dimension === 'duration' ? totalDuration : totalIncome
    const projectDistribution = Object.values(projectMap).map(p => ({
      ...p,
      percentage: totalVal > 0 ? (p.value / totalVal * 100).toFixed(0) : 0
    })).sort((a, b) => b.value - a.value)

    this.setData({
      summary: {
        totalDuration: totalDuration.toFixed(1),
        totalIncome: totalIncome.toFixed(2),
        compareText: '+12%' // 模拟对比数据
      },
      barChartData,
      projectDistribution
    })
  }
})
