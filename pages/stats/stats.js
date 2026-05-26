const { formatDate, getRecordDurationHours, calculateRecordIncome } = require('../../utils/util')
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

    // 缓存项目映射（按 id），避免循环内多次查询
    const projects = storageService.getProjects()
    const projectsById = {}
    projects.forEach(p => { projectsById[p.id] = p })
    const rateOf = r => {
      const p = projectsById[r.projectId]
      return p ? (p.hourlyRate || 0) : 0
    }

    const records = storageService.getRecords({ startDate, endDate })

    // 汇总
    let totalDuration = 0
    let totalIncome = 0
    const projectMap = {}

    records.forEach(r => {
      const d = getRecordDurationHours(r)
      const rate = rateOf(r)
      totalDuration += d
      totalIncome += calculateRecordIncome(r, rate)

      if (!projectMap[r.projectId]) {
        projectMap[r.projectId] = {
          name: r.projectName,
          color: r.projectColor,
          value: 0
        }
      }
      projectMap[r.projectId].value += (dimension === 'duration' ? d : calculateRecordIncome(r, rate))
    })

    // 柱状图
    let chartValues
    if (period === 'year') {
      chartValues = new Array(12).fill(0)
      records.forEach(r => {
        const month = parseInt(r.startTime.substring(5, 7), 10) - 1
        const d = getRecordDurationHours(r)
        chartValues[month] += (dimension === 'duration' ? d : calculateRecordIncome(r, rateOf(r)))
      })
    } else {
      chartValues = new Array(dateRange.length).fill(0)
      records.forEach(r => {
        const date = r.startTime.split(' ')[0]
        const idx = dateRange.indexOf(date)
        if (idx !== -1) {
          const d = getRecordDurationHours(r)
          chartValues[idx] += (dimension === 'duration' ? d : calculateRecordIncome(r, rateOf(r)))
        }
      })
    }

    const maxValue = Math.max(...chartValues, 1)
    const barChartData = chartValues.map((v, i) => ({
      label: labels[i],
      value: v,
      height: (v / maxValue * 100) + '%'
    }))

    // 项目分布
    const totalVal = dimension === 'duration' ? totalDuration : totalIncome
    const projectDistribution = Object.values(projectMap).map(p => ({
      ...p,
      percentage: totalVal > 0 ? (p.value / totalVal * 100).toFixed(0) : 0
    })).sort((a, b) => b.value - a.value)

    // 与上一周期对比
    const prevRange = getPreviousRange(startDate, endDate)
    const prevRecords = storageService.getRecords(prevRange)
    let prevTotal = 0
    prevRecords.forEach(r => {
      const d = getRecordDurationHours(r)
      prevTotal += (dimension === 'duration' ? d : calculateRecordIncome(r, rateOf(r)))
    })
    const currentTotal = dimension === 'duration' ? totalDuration : totalIncome
    let compareText
    if (prevTotal === 0) {
      compareText = currentTotal > 0 ? '新增' : '—'
    } else {
      const diff = (currentTotal - prevTotal) / prevTotal * 100
      const sign = diff >= 0 ? '+' : ''
      compareText = `${sign}${diff.toFixed(0)}%`
    }

    this.setData({
      summary: {
        totalDuration: totalDuration.toFixed(1),
        totalIncome: totalIncome.toFixed(2),
        compareText
      },
      barChartData,
      projectDistribution
    })
  }
})

// 给定日期区间，计算上一个等长区间
function getPreviousRange(startDate, endDate) {
  const start = new Date(startDate.replace(/-/g, '/'))
  const end = new Date(endDate.replace(/-/g, '/'))
  const spanMs = end - start
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000)
  const prevStart = new Date(prevEnd.getTime() - spanMs)
  return { startDate: formatDate(prevStart), endDate: formatDate(prevEnd) }
}
