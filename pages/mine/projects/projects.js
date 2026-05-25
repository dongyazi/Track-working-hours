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
    this.setData({
      showAddModal: true,
      newProject: {
        name: '',
        hourlyRate: 35,
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
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个项目吗？相关的工时记录不会被自动删除。',
      success: (res) => {
        if (res.confirm) {
          storageService.deleteProject(id)
          this.loadProjects()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
