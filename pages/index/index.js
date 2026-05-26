const {
  formatDate,
  formatTime,
  parseDateTime,
  getRecordDurationHours,
  calculateRecordIncome
} = require('../../utils/util')
const storageService = require('../../services/storage')

const ACTIVE_CLOCK_KEY = 'wt_active_clock'
const LAST_PROJECT_KEY = 'wt_last_project'

const pad2 = n => n.toString().padStart(2, '0')

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const formatClock = date => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`

const parseDate = dateText => {
  const [year, month, day] = dateText.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const buildDateTimeText = (dateText, timeText) => `${dateText} ${timeText}:00`

const formatDuration = hours => {
  const totalMinutes = Math.max(0, Math.round((Number(hours) || 0) * 60))
  return `${Math.floor(totalMinutes / 60)}小时${pad2(totalMinutes % 60)}分`
}

const formatCalendarDuration = hours => {
  const totalMinutes = Math.max(0, Math.round((Number(hours) || 0) * 60))
  if (totalMinutes === 0) return ''
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

const formatSelectedDateText = dateText => {
  const date = parseDate(dateText)
  const today = formatDate(new Date())
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  const label = dateText === today ? '今天' : `${date.getMonth() + 1}月${date.getDate()}日`
  return `${label} ${week}`
}

Page({
  data: {
    currentTime: '',
    weekLabels: WEEK_LABELS,
    calendarTitle: '',
    calendarWeeks: [],
    selectedDate: '',
    selectedDateText: '',
    selectedWorkTime: '0小时00分',
    selectedRecordsCount: 0,
    todayWorkTime: '0小时00分',
    todayIncome: '0.00',
    todayRecordsCount: 0,
    isClockedIn: false,
    clockInDisplay: '--:--',
    elapsedTime: '0小时00分',
    hasMissedClockOut: false,
    missedClockStartText: '',
    missedClockStartDate: '',
    missedClockOutDate: '',
    missedClockOutTime: '',
    maxClockOutDate: '',
    lastProject: null,
    showProjectSelector: false,
    showSuccessOverlay: false,
    lastRecord: null,
    projects: []
  },

  onLoad() {
    const now = new Date()
    this._displayYear = now.getFullYear()
    this._displayMonth = now.getMonth()
    this.setData({ selectedDate: formatDate(now) })
    this.updateTime()
    this.startTimer()
  },

  onShow() {
    this.loadData()
  },

  onUnload() {
    this.stopTimer()
    if (this._hideOverlayTimer) {
      clearTimeout(this._hideOverlayTimer)
      this._hideOverlayTimer = null
    }
  },

  startTimer() {
    this._timer = setInterval(() => {
      this.updateTime()
      this.updateActiveElapsed()
    }, 30 * 1000)
  },

  stopTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  updateTime() {
    const now = new Date()
    const currentTime = formatClock(now)
    if (currentTime !== this.data.currentTime) {
      this.setData({ currentTime })
    }
  },

  loadData() {
    const projects = storageService.getProjects()
    let lastProject = wx.getStorageSync(LAST_PROJECT_KEY)

    if (!lastProject && projects.length > 0) {
      lastProject = projects[0]
      wx.setStorageSync(LAST_PROJECT_KEY, lastProject)
    }

    if (lastProject && !projects.find(p => p.id === lastProject.id)) {
      lastProject = projects[0] || null
      if (lastProject) {
        wx.setStorageSync(LAST_PROJECT_KEY, lastProject)
      } else {
        wx.removeStorageSync(LAST_PROJECT_KEY)
      }
    }

    const activeClock = wx.getStorageSync(ACTIVE_CLOCK_KEY) || null
    const missedClockState = this.getMissedClockState(activeClock)

    this.setData({
      projects,
      lastProject,
      isClockedIn: !!activeClock,
      clockInDisplay: activeClock ? activeClock.startTime.split(' ')[1].substring(0, 5) : '--:--',
      ...missedClockState
    })

    this.refreshWorkSummary()
    this.updateActiveElapsed()
  },

  refreshWorkSummary() {
    const today = formatDate(new Date())
    const selectedDate = this.data.selectedDate || today
    const todayRecords = storageService.getRecords({ startDate: today, endDate: today })
    const selectedRecords = storageService.getRecords({ startDate: selectedDate, endDate: selectedDate })
    const todayDuration = this.sumDuration(todayRecords)
    const selectedDuration = this.sumDuration(selectedRecords)
    const todayIncome = this.sumIncome(todayRecords)

    this.setData({
      todayWorkTime: formatDuration(todayDuration),
      selectedWorkTime: formatDuration(selectedDuration),
      selectedRecordsCount: selectedRecords.length,
      selectedDateText: formatSelectedDateText(selectedDate),
      todayIncome: todayIncome.toFixed(2),
      todayRecordsCount: todayRecords.length,
      calendarTitle: `${this._displayYear}年${this._displayMonth + 1}月`,
      calendarWeeks: this.buildCalendarWeeks()
    })
  },

  sumDuration(records) {
    return records.reduce((sum, record) => sum + getRecordDurationHours(record), 0)
  },

  sumIncome(records) {
    const projectRateMap = this.data.projects.reduce((map, project) => {
      map[project.id] = Number(project.hourlyRate) || 0
      return map
    }, {})

    return records.reduce((sum, record) => {
      const rate = projectRateMap[record.projectId] || 0
      return sum + calculateRecordIncome(record, rate)
    }, 0)
  },

  buildCalendarWeeks() {
    const firstDay = new Date(this._displayYear, this._displayMonth, 1)
    const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    const cursor = new Date(this._displayYear, this._displayMonth, 1 - offset)
    const today = formatDate(new Date())
    const selectedDate = this.data.selectedDate || today
    const firstVisibleDate = formatDate(cursor)
    const lastVisible = new Date(cursor)
    lastVisible.setDate(lastVisible.getDate() + 41)
    const visibleRecords = storageService.getRecords({
      startDate: firstVisibleDate,
      endDate: formatDate(lastVisible)
    })
    const durationByDate = this.groupDurationByDate(visibleRecords)
    const weeks = []

    for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
      const week = []
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const dateText = formatDate(cursor)
        const duration = durationByDate[dateText] || 0
        const classList = ['calendar-day']

        if (cursor.getMonth() !== this._displayMonth) classList.push('is-muted')
        if (dateText === today) classList.push('is-today')
        if (dateText === selectedDate) classList.push('is-selected')
        if (duration > 0) classList.push('has-record')

        week.push({
          date: dateText,
          day: cursor.getDate(),
          durationText: formatCalendarDuration(duration),
          className: classList.join(' ')
        })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }

    return weeks
  },

  groupDurationByDate(records) {
    return records.reduce((map, record) => {
      const date = record.startTime.split(' ')[0]
      map[date] = (map[date] || 0) + getRecordDurationHours(record)
      return map
    }, {})
  },

  getMissedClockState(activeClock) {
    if (!activeClock) {
      return {
        hasMissedClockOut: false,
        missedClockStartText: '',
        missedClockStartDate: '',
        missedClockOutDate: '',
        missedClockOutTime: '',
        maxClockOutDate: formatDate(new Date())
      }
    }

    const now = new Date()
    const today = formatDate(now)
    const start = parseDateTime(activeClock.startTime)
    const startDate = activeClock.startTime.split(' ')[0]
    const hasMissedClockOut = startDate < today

    if (!hasMissedClockOut) {
      return {
        hasMissedClockOut: false,
        missedClockStartText: activeClock.startTime,
        missedClockStartDate: startDate,
        missedClockOutDate: startDate,
        missedClockOutTime: formatClock(now),
        maxClockOutDate: today
      }
    }

    return {
      hasMissedClockOut: true,
      missedClockStartText: activeClock.startTime,
      missedClockStartDate: startDate,
      missedClockOutDate: today,
      missedClockOutTime: formatClock(now),
      maxClockOutDate: today
    }
  },

  updateActiveElapsed() {
    const activeClock = wx.getStorageSync(ACTIVE_CLOCK_KEY)
    if (!activeClock) {
      if (this.data.elapsedTime !== '0小时00分') {
        this.setData({ elapsedTime: '0小时00分' })
      }
      return
    }

    const start = parseDateTime(activeClock.startTime)
    const duration = (Date.now() - start.getTime()) / (1000 * 60 * 60)
    this.setData({
      elapsedTime: formatDuration(duration),
      clockInDisplay: activeClock.startTime.split(' ')[1].substring(0, 5),
      isClockedIn: true
    })
  },

  onPrevMonth() {
    this._displayMonth -= 1
    if (this._displayMonth < 0) {
      this._displayMonth = 11
      this._displayYear -= 1
    }
    this.refreshWorkSummary()
  },

  onNextMonth() {
    this._displayMonth += 1
    if (this._displayMonth > 11) {
      this._displayMonth = 0
      this._displayYear += 1
    }
    this.refreshWorkSummary()
  },

  onTodayTap() {
    const now = new Date()
    this._displayYear = now.getFullYear()
    this._displayMonth = now.getMonth()
    this.setData({ selectedDate: formatDate(now) })
    this.refreshWorkSummary()
  },

  onSelectDate(e) {
    const date = e.currentTarget.dataset.date
    const picked = parseDate(date)
    this._displayYear = picked.getFullYear()
    this._displayMonth = picked.getMonth()
    this.setData({ selectedDate: date })
    this.refreshWorkSummary()
  },

  onClockIn() {
    if (this.data.isClockedIn) {
      wx.showToast({ title: '已在上班打卡中', icon: 'none' })
      return
    }

    if (!this.data.lastProject) {
      wx.showToast({ title: '请先选择项目', icon: 'none' })
      return
    }

    const now = new Date()
    const activeClock = {
      projectId: this.data.lastProject.id,
      projectName: this.data.lastProject.name,
      projectColor: this.data.lastProject.color,
      startTime: formatTime(now),
      createTime: now.toISOString()
    }

    wx.setStorageSync(ACTIVE_CLOCK_KEY, activeClock)
    wx.setStorageSync(LAST_PROJECT_KEY, this.data.lastProject)

    this.setData({
      isClockedIn: true,
      clockInDisplay: formatClock(now),
      elapsedTime: '0小时00分'
    })

    wx.showToast({ title: '上班打卡成功', icon: 'success' })
    this.updateActiveElapsed()
  },

  onClockOut() {
    const activeClock = wx.getStorageSync(ACTIVE_CLOCK_KEY)

    if (!activeClock) {
      wx.showToast({ title: '请先上班打卡', icon: 'none' })
      return
    }

    const now = new Date()
    this.saveClockOut(activeClock, now)
  },

  onMissedClockOutDateChange(e) {
    this.setData({ missedClockOutDate: e.detail.value })
  },

  onMissedClockOutTimeChange(e) {
    this.setData({ missedClockOutTime: e.detail.value })
  },

  onConfirmMissedClockOut() {
    const activeClock = wx.getStorageSync(ACTIVE_CLOCK_KEY)
    if (!activeClock) {
      wx.showToast({ title: '没有待补下班记录', icon: 'none' })
      this.loadData()
      return
    }

    const end = parseDateTime(buildDateTimeText(this.data.missedClockOutDate, this.data.missedClockOutTime))
    if (end > new Date()) {
      wx.showToast({ title: '下班时间不能晚于现在', icon: 'none' })
      return
    }

    this.saveClockOut(activeClock, end)
  },

  saveClockOut(activeClock, end) {
    const start = parseDateTime(activeClock.startTime)

    if (start >= end) {
      wx.showToast({ title: '下班时间必须晚于上班时间', icon: 'none' })
      return
    }

    const duration = (end - start) / (1000 * 60 * 60)
    const savedRecord = storageService.addRecord({
      projectId: activeClock.projectId,
      projectName: activeClock.projectName,
      projectColor: activeClock.projectColor,
      startTime: activeClock.startTime,
      endTime: formatTime(end),
      duration: duration.toFixed(2),
      status: 'pending'
    })

    wx.removeStorageSync(ACTIVE_CLOCK_KEY)

    this.setData({
      showSuccessOverlay: true,
      lastRecord: savedRecord,
      isClockedIn: false,
      clockInDisplay: '--:--',
      elapsedTime: '0小时00分',
      hasMissedClockOut: false,
      missedClockStartText: '',
      missedClockStartDate: '',
      missedClockOutDate: '',
      missedClockOutTime: ''
    })

    this.loadData()

    if (wx.vibrateShort) {
      wx.vibrateShort()
    }

    if (this._hideOverlayTimer) clearTimeout(this._hideOverlayTimer)
    this._hideOverlayTimer = setTimeout(() => {
      this.setData({ showSuccessOverlay: false })
      this._hideOverlayTimer = null
    }, 3000)
  },

  onChangeProject() {
    if (this.data.projects.length === 0) {
      wx.showModal({
        title: '提示',
        content: '还没有项目，去创建一个吧',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/mine/projects/projects' })
          }
        }
      })
      return
    }
    this.setData({ showProjectSelector: true })
  },

  onManageProjects() {
    this.setData({ showProjectSelector: false })
    wx.navigateTo({ url: '/pages/mine/projects/projects' })
  },

  onSelectProject(e) {
    const project = e.currentTarget.dataset.project
    this.setData({
      lastProject: project,
      showProjectSelector: false
    })
    wx.setStorageSync(LAST_PROJECT_KEY, project)
    this.refreshWorkSummary()
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
