const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

const parseDateTime = dateTimeText => {
  if (!dateTimeText) return null
  const date = new Date(dateTimeText.replace(/-/g, '/'))
  return Number.isNaN(date.getTime()) ? null : date
}

const getRecordDurationHours = record => {
  const start = parseDateTime(record && record.startTime)
  const end = parseDateTime(record && record.endTime)

  if (start && end && end > start) {
    return (end - start) / (1000 * 60 * 60)
  }

  return parseFloat((record && record.duration) || 0) || 0
}

const calculateRecordIncome = (record, hourlyRate) => {
  return getRecordDurationHours(record) * (Number(hourlyRate) || 0)
}

/**
 * 离线存储工具
 */
const storage = {
  get(key) {
    try {
      return wx.getStorageSync(key)
    } catch (e) {
      console.warn('[storage.get]', key, e)
      return undefined
    }
  },
  set(key, value) {
    try {
      wx.setStorageSync(key, value)
    } catch (e) {
      console.warn('[storage.set]', key, e)
    }
  },
  remove(key) {
    try {
      wx.removeStorageSync(key)
    } catch (e) {
      console.warn('[storage.remove]', key, e)
    }
  },
  clear() {
    try {
      wx.clearStorageSync()
    } catch (e) {
      console.warn('[storage.clear]', e)
    }
  }
}

module.exports = {
  formatTime,
  formatDate,
  parseDateTime,
  getRecordDurationHours,
  calculateRecordIncome,
  storage
}
