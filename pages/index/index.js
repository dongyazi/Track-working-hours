const { formatDate, formatTime } = require('../../utils/util')
const storageService = require('../../services/storage')

Page({
  data: {
    currentTime: '',
    todayWorkTime: '0小时00分',
    todayIncome: '0.00',
    lastProject: null,
    todayRecordsCount: 0,
    showProjectSelector: false,
    showSuccessOverlay: false,
    lastRecord: null,
    projects: [],
    timer: null
  },

  onLoad() {
    this.updateTime()
    this.startTimer()
  },

  onShow() {
    this.loadData()
  },

  onUnload() {
    this.stopTimer()
  },

  startTimer() {
    const timer = setInterval(() => {
      this.updateTime()
    }, 1000)
    this.setData({ timer })
  },

  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  updateTime() {
    const now = new Date()
    const currentTime = now.toTimeString().substring(0, 5)
    this.setData({ currentTime })
  },

  loadData() {
    const projects = storageService.getProjects()
    let lastProject = wx.getStorageSync('wt_last_project')
    
    // 如果没有上次使用的项目，默认选择第一个
    if (!lastProject && projects.length > 0) {
      lastProject = projects[0]
      wx.setStorageSync('wt_last_project', lastProject)
    }

    const today = formatDate(new Date())
    const records = storageService.getRecords({ startDate: today, endDate: today })
    
    let totalDuration = 0
    records.forEach(r => {
      totalDuration += parseFloat(r.duration || 0)
    })

    const hours = Math.floor(totalDuration)
    const minutes = Math.round((totalDuration - hours) * 60)
    
    const income = (totalDuration * (lastProject ? lastProject.hourlyRate : 0)).toFixed(2)

    this.setData({
      projects,
      lastProject,
      todayWorkTime: `${hours}小时${minutes.toString().padStart(2, '0')}分`,
      todayIncome: income,
      todayRecordsCount: records.length
    })
  },

  onClockOut() {
    if (!this.data.lastProject) {
      wx.showToast({
        title: '请先选择一个项目',
        icon: 'none'
      })
      return
    }

    const now = new Date()
    const today = formatDate(now)
    const endTime = formatTime(now)
    
    // 根据需求：若没有上班打卡则默认从今日 00:00 开始
    const startTimeDate = new Date(now)
    startTimeDate.setHours(0, 0, 0, 0)
    
    const startTime = formatTime(startTimeDate)
    const duration = (now - startTimeDate) / (1000 * 60 * 60)

    const newRecord = {
      projectId: this.data.lastProject.id,
      projectName: this.data.lastProject.name,
      projectColor: this.data.lastProject.color,
      startTime: startTime,
      endTime: endTime,
      duration: duration.toFixed(2),
      status: 'pending'
    }

    const savedRecord = storageService.addRecord(newRecord)
    
    this.setData({
      showSuccessOverlay: true,
      lastRecord: savedRecord
    })
    
    this.loadData()
    
    // 触发震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort()
    }

    // 3秒后自动隐藏成功提示
    setTimeout(() => {
      this.setData({ showSuccessOverlay: false })
    }, 3000)
  },

  onChangeProject() {
    if (this.data.projects.length === 0) {
      wx.showModal({
        title: '提示',
        content: '还没有项目，去创建一个吧',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/mine/mine' })
          }
        }
      })
      return
    }
    this.setData({ showProjectSelector: true })
  },

  onSelectProject(e) {
    const project = e.currentTarget.dataset.project
    this.setData({
      lastProject: project,
      showProjectSelector: false
    })
    wx.setStorageSync('wt_last_project', project)
    this.loadData()
  },

  hideProjectSelector() {
    this.setData({ showProjectSelector: false })
  },

  onAddRecord() {
    wx.navigateTo({
      url: '/pages/record/edit/edit'
    })
  }
})
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
