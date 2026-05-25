const { formatDate, formatTime } = require('../../../utils/util')
const storageService = require('../../../services/storage')

Page({
  data: {
    isEdit: false,
    recordId: null,
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    projects: [],
    projectIndex: 0,
    remark: ''
  },

  onLoad(options) {
    const now = new Date()
    this.setData({
      date: formatDate(now)
    })

    const projects = storageService.getProjects()
    this.setData({ projects })

    if (options.id) {
      this.setData({
        isEdit: true,
        recordId: options.id
      })
      this.loadRecord(options.id)
    } else {
      // 设置默认项目
      const lastProject = wx.getStorageSync('wt_last_project')
      if (lastProject) {
        const index = projects.findIndex(p => p.id === lastProject.id)
        if (index !== -1) {
          this.setData({ projectIndex: index })
        }
      }
    }
  },

  loadRecord(id) {
    const records = storageService.getRecords()
    const record = records.find(r => r.id === id)
    if (record) {
      const [date, startTime] = record.startTime.split(' ')
      const [, endTime] = record.endTime.split(' ')
      
      const projects = this.data.projects
      const projectIndex = projects.findIndex(p => p.id === record.projectId)

      this.setData({
        date,
        startTime: startTime.substring(0, 5),
        endTime: endTime.substring(0, 5),
        projectIndex: projectIndex !== -1 ? projectIndex : 0,
        remark: record.remark || ''
      })
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value })
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value })
  },

  onProjectChange(e) {
    this.setData({ projectIndex: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onSave() {
    const { date, startTime, endTime, projectIndex, projects, remark, isEdit, recordId } = this.data
    
    if (projects.length === 0) {
      wx.showToast({ title: '请先创建项目', icon: 'none' })
      return
    }

    const project = projects[projectIndex]
    const startStr = `${date} ${startTime}:00`
    const endStr = `${date} ${endTime}:00`
    
    const start = new Date(startStr.replace(/-/g, '/'))
    const end = new Date(endStr.replace(/-/g, '/'))

    if (end <= start) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
      return
    }

    const duration = (end - start) / (1000 * 60 * 60)

    const recordData = {
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
      startTime: startStr,
      endTime: endStr,
      duration: duration.toFixed(2),
      remark: remark,
      status: 'pending'
    }

    if (isEdit) {
      recordData.id = recordId
      storageService.updateRecord(recordData)
    } else {
      storageService.addRecord(recordData)
      wx.setStorageSync('wt_last_project', project)
    }

    wx.showToast({
      title: isEdit ? '已更新' : '已添加',
      icon: 'success'
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1000)
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条工时记录吗？',
      success: (res) => {
        if (res.confirm) {
          storageService.deleteRecord(this.data.recordId)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1000)
        }
      }
    })
  }
})
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
/home/engine/.bashrc: line 1: syntax error near unexpected token `('
/home/engine/.bashrc: line 1: `. /etc/profile.d/workload-containment.shn# ~/.bashrc: executed by bash(1) for non-login shells.'
