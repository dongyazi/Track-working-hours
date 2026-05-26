const storageService = require('../../../services/storage')

Page({
  data: {
    record: null,
    isEdit: false,
    statusOptions: [
      { label: '待结算', value: 'pending' },
      { label: '已结算', value: 'settled' },
      { label: '有异常', value: 'abnormal' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.loadRecord(options.id)
    }
  },

  loadRecord(id) {
    const records = storageService.getRecords()
    const record = records.find(r => r.id === id)
    if (record) {
      this.setData({ record })
    } else {
      wx.showToast({
        title: '未找到该记录',
        icon: 'none'
      })
      this._navTimer = setTimeout(() => {
        this._navTimer = null
        wx.navigateBack()
      }, 1500)
    }
  },

  onStatusChange(e) {
    const status = e.detail.value
    const record = this.data.record
    record.status = status
    this.setData({ record })
  },

  onRemarkInput(e) {
    const remark = e.detail.value
    const record = this.data.record
    record.remark = remark
    this.setData({ record })
  },

  onSave() {
    storageService.updateRecord(this.data.record)
    wx.showToast({
      title: '已保存',
      icon: 'success'
    })
    this._navTimer = setTimeout(() => {
      this._navTimer = null
      wx.navigateBack()
    }, 1000)
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条工时记录吗？',
      success: (res) => {
        if (res.confirm) {
          storageService.deleteRecord(this.data.record.id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this._navTimer = setTimeout(() => {
            this._navTimer = null
            wx.navigateBack()
          }, 1000)
        }
      }
    })
  },

  onUnload() {
    if (this._navTimer) {
      clearTimeout(this._navTimer)
      this._navTimer = null
    }
  }
})
