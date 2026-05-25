const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
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

/**
 * 离线存储工具
 */
const storage = {
  get(key) {
    return wx.getStorageSync(key)
  },
  set(key, value) {
    wx.setStorageSync(key, value)
  },
  remove(key) {
    wx.removeStorageSync(key)
  },
  clear() {
    wx.clearStorageSync()
  }
}

module.exports = {
  formatTime,
  formatDate,
  storage
}
