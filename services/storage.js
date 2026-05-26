const { storage } = require('../utils/util')

const KEYS = {
  PROJECTS: 'wt_projects',
  RECORDS: 'wt_records',
  SETTINGS: 'wt_settings'
}

/**
 * 生成唯一ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

/**
 * 项目管理
 */
const projectService = {
  getProjects() {
    return storage.get(KEYS.PROJECTS) || []
  },

  addProject(project) {
    const projects = this.getProjects()
    const newProject = {
      id: generateId(),
      name: project.name,
      color: project.color || '#3B82F6',
      hourlyRate: project.hourlyRate || 0,
      createTime: new Date().toISOString(),
      ...project
    }
    projects.unshift(newProject)
    storage.set(KEYS.PROJECTS, projects)
    return newProject
  },

  updateProject(updatedProject) {
    let projects = this.getProjects()
    projects = projects.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p)
    storage.set(KEYS.PROJECTS, projects)
    return updatedProject
  },

  deleteProject(projectId, { cascade = false } = {}) {
    let projects = this.getProjects()
    projects = projects.filter(p => p.id !== projectId)
    storage.set(KEYS.PROJECTS, projects)

    if (cascade) {
      let records = storage.get(KEYS.RECORDS) || []
      records = records.filter(r => r.projectId !== projectId)
      storage.set(KEYS.RECORDS, records)
    }

    const lastProject = storage.get('wt_last_project')
    if (lastProject && lastProject.id === projectId) {
      storage.remove('wt_last_project')
    }
  }
}

/**
 * 工时记录管理
 */
const recordService = {
  getRecords(filters = {}) {
    const { projectId, status, startDate, endDate } = filters
    const all = storage.get(KEYS.RECORDS) || []

    return all
      .filter(r => {
        if (projectId && r.projectId !== projectId) return false
        if (status && r.status !== status) return false
        if (startDate && endDate) {
          const date = r.startTime.split(' ')[0]
          if (date < startDate || date > endDate) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  },

  addRecord(record) {
    const records = storage.get(KEYS.RECORDS) || []
    const newRecord = {
      id: generateId(),
      projectId: record.projectId,
      projectName: record.projectName,
      projectColor: record.projectColor,
      startTime: record.startTime, // 格式: YYYY-MM-DD HH:mm:ss
      endTime: record.endTime,
      duration: record.duration, // 小时
      status: record.status || 'pending', // pending, settled, abnormal
      remark: record.remark || '',
      createTime: new Date().toISOString(),
      ...record
    }
    records.unshift(newRecord)
    storage.set(KEYS.RECORDS, records)
    return newRecord
  },

  updateRecord(updatedRecord) {
    let records = storage.get(KEYS.RECORDS) || []
    records = records.map(r => r.id === updatedRecord.id ? { ...r, ...updatedRecord } : r)
    storage.set(KEYS.RECORDS, records)
    return updatedRecord
  },

  deleteRecord(recordId) {
    let records = storage.get(KEYS.RECORDS) || []
    records = records.filter(r => r.id !== recordId)
    storage.set(KEYS.RECORDS, records)
  },

  markAsSettled(recordId) {
    return this.updateRecord({ id: recordId, status: 'settled' })
  }
}

module.exports = {
  ...projectService,
  ...recordService
}
