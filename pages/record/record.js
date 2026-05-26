const { formatDate } = require('../../utils/util')
const storageService = require('../../services/storage')

Page({
  data: {
    activeFilter: 'all', // all, week, month
    groupedRecords: [],
    isEmpty: false,
    startX: 0, // 用于滑动删除
  },

  onShow() {
    this.loadRecords()
  },

  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ activeFilter: filter })
    this.loadRecords()
  },

  loadRecords() {
    const filter = this.data.activeFilter
    let filters = {}

    if (filter === 'week') {
      const now = new Date()
      const day = now.getDay() || 7
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
      filters.startDate = formatDate(start)
      filters.endDate = formatDate(now)
    } else if (filter === 'month') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      filters.startDate = formatDate(start)
      filters.endDate = formatDate(now)
    }

    const records = storageService.getRecords(filters)
    const grouped = this.groupRecordsByDate(records)

    this._activeSwipe = null
    this.setData({
      groupedRecords: grouped,
      isEmpty: records.length === 0
    })
  },

  groupRecordsByDate(records) {
    if (!records || records.length === 0) return []

    const groups = {}
    const today = formatDate(new Date())
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = formatDate(yesterdayDate)

    records.forEach(record => {
      const date = record.startTime.split(' ')[0]
      let groupTitle = date

      if (date === today) {
        groupTitle = '今天'
      } else if (date === yesterday) {
        groupTitle = '昨天'
      }

      if (!groups[groupTitle]) {
        groups[groupTitle] = {
          title: groupTitle,
          records: []
        }
      }

      // 添加滑动偏移状态
      groups[groupTitle].records.push({
        ...record,
        offsetX: 0,
        // 处理显示的时间段
        timeRange: `${record.startTime.split(' ')[1].substring(0, 5)} - ${record.endTime.split(' ')[1].substring(0, 5)}`
      })
    })

    return Object.values(groups)
  },

  // 滑动删除逻辑
  touchStart(e) {
    this.setData({
      startX: e.touches[0].clientX
    })
  },

  touchMove(e) {
    const clientX = e.touches[0].clientX
    const { index, groupindex } = e.currentTarget.dataset
    const offsetX = this.data.startX - clientX

    if (offsetX > 20) {
      this.updateRecordOffset(groupindex, index, -80)
    } else if (offsetX < -20) {
      this.updateRecordOffset(groupindex, index, 0)
    }
  },

  updateRecordOffset(groupIndex, recordIndex, offset) {
    const patch = {}
    const prev = this._activeSwipe
    if (prev && (prev.gi !== groupIndex || prev.ri !== recordIndex)) {
      patch[`groupedRecords[${prev.gi}].records[${prev.ri}].offsetX`] = 0
    }
    patch[`groupedRecords[${groupIndex}].records[${recordIndex}].offsetX`] = offset
    this.setData(patch)
    this._activeSwipe = offset === 0 ? null : { gi: groupIndex, ri: recordIndex }
  },

  onDeleteRecord(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条工时记录吗？',
      success: (res) => {
        if (res.confirm) {
          storageService.deleteRecord(id)
          this.loadRecords()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onRecordClick(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${id}`
    })
  },

  onAddRecord() {
    wx.navigateTo({
      url: '/pages/record/edit/edit'
    })
  }
})
