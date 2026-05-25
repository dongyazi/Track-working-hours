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
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
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

  deleteProject(projectId) {
    let projects = this.getProjects()
    projects = projects.filter(p => p.id !== projectId)
    storage.set(KEYS.PROJECTS, projects)
    // 注意：此处未处理属于该项目的工时记录，可根据需要决定是否连带删除
  }
}

/**
 * 工时记录管理
 */
const recordService = {
  getRecords(filters = {}) {
    let records = storage.get(KEYS.RECORDS) || []
    
    if (filters.projectId) {
      records = records.filter(r => r.projectId === filters.projectId)
    }
    
    if (filters.status) {
      records = records.filter(r => r.status === filters.status)
    }

    if (filters.startDate && filters.endDate) {
      records = records.filter(r => {
        const date = r.startTime.split(' ')[0]
        return date >= filters.startDate && date <= filters.endDate
      })
    }

    // 按开始时间倒序排列
    return records.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
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
