const storageService = require('../../../services/storage')

Page({
  data: {
    projects: [],
    showAddModal: false,
    newProject: {
      name: '',
      hourlyRate: 35,
      color: '#3B82F6'
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4']
  },

  onShow() {
    this.loadProjects()
  },

  loadProjects() {
    const projects = storageService.getProjects()
    this.setData({ projects })
  },

  onShowAddModal() {
    const settings = wx.getStorageSync('wt_settings') || {}
    const defaultRate = typeof settings.defaultHourlyRate === 'number' ? settings.defaultHourlyRate : 35
    this.setData({
      showAddModal: true,
      newProject: {
        name: '',
        hourlyRate: defaultRate,
        color: '#3B82F6'
      }
    })
  },

  onHideAddModal() {
    this.setData({ showAddModal: false })
  },

  onInputName(e) {
    this.setData({ 'newProject.name': e.detail.value })
  },

  onInputRate(e) {
    this.setData({ 'newProject.hourlyRate': parseFloat(e.detail.value) || 0 })
  },

  onSelectColor(e) {
    this.setData({ 'newProject.color': e.currentTarget.dataset.color })
  },

  onSaveProject() {
    if (!this.data.newProject.name) {
      wx.showToast({ title: '请输入项目名称', icon: 'none' })
      return
    }
    storageService.addProject(this.data.newProject)
    this.loadProjects()
    this.onHideAddModal()
    wx.showToast({ title: '已添加', icon: 'success' })
  },

  onDeleteProject(e) {
    const { id } = e.currentTarget.dataset
    const records = storageService.getRecords({ projectId: id })
    const hasRecords = records.length > 0

    wx.showModal({
      title: '确认删除',
      content: hasRecords
        ? `该项目下有 ${records.length} 条工时记录，确定要删除项目吗？`
        : '确定要删除这个项目吗？',
      success: (res) => {
        if (!res.confirm) return

        if (!hasRecords) {
          storageService.deleteProject(id)
          this.loadProjects()
          wx.showToast({ title: '已删除', icon: 'success' })
          return
        }

        wx.showModal({
          title: '关联记录',
          content: '是否同时删除该项目下的所有工时记录？',
          confirmText: '一起删除',
          cancelText: '保留记录',
          success: (res2) => {
            const cascade = !!res2.confirm
            storageService.deleteProject(id, { cascade })
            this.loadProjects()
            wx.showToast({ title: '已删除', icon: 'success' })
          }
        })
      }
    })
  }
})
