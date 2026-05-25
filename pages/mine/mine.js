const storageService = require('../../services/storage')

Page({
  data: {
    userInfo: {
      name: '工时用户',
      avatar: '/assets/default-avatar.png',
      hourlyRate: 35,
      totalDuration: 0
    },
    projectCount: 0,
    reminderTime: '18:00'
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const projects = storageService.getProjects()
    const records = storageService.getRecords()
    
    let totalDuration = 0
    records.forEach(r => {
      totalDuration += parseFloat(r.duration || 0)
    })

    // 从本地存储获取设置
    const settings = wx.getStorageSync('wt_settings') || {}

    this.setData({
      projectCount: projects.length,
      'userInfo.totalDuration': totalDuration.toFixed(1),
      'userInfo.hourlyRate': settings.defaultHourlyRate || 35,
      reminderTime: settings.reminderTime || '18:00'
    })
  },

  navToProjects() {
    wx.navigateTo({ url: '/pages/mine/projects/projects' })
  },

  onExport() {
    wx.showToast({ title: '导出功能即将上线', icon: 'none' })
  },

  onBackup() {
    wx.showToast({ title: '云端备份即将上线', icon: 'none' })
  },

  onHourlyRateChange() {
    wx.showModal({
      title: '设置默认时薪',
      editable: true,
      placeholderText: '请输入金额',
      content: this.data.userInfo.hourlyRate.toString(),
      success: (res) => {
        if (res.confirm && res.content) {
          const rate = parseFloat(res.content)
          if (!isNaN(rate)) {
            const settings = wx.getStorageSync('wt_settings') || {}
            settings.defaultHourlyRate = rate
            wx.setStorageSync('wt_settings', settings)
            this.loadData()
          }
        }
      }
    })
  },

  onReminderTimeChange(e) {
    const time = e.detail.value
    const settings = wx.getStorageSync('wt_settings') || {}
    settings.reminderTime = time
    wx.setStorageSync('wt_settings', settings)
    this.setData({ reminderTime: time })
  }
})
