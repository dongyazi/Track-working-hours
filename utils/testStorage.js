const storageService = require('../services/storage')

// 模拟微信环境中的存储
global.wx = {
  getStorageSync: (key) => {
    return global._mockStorage[key]
  },
  setStorageSync: (key, value) => {
    global._mockStorage[key] = value
  },
  removeStorageSync: (key) => {
    delete global._mockStorage[key]
  },
  clearStorageSync: () => {
    global._mockStorage = {}
  }
}
global._mockStorage = {}

// 测试项目管理
console.log('--- 测试项目管理 ---')
const p1 = storageService.addProject({ name: '装修项目', color: '#FF0000', hourlyRate: 50 })
console.log('添加项目1:', p1)

const p2 = storageService.addProject({ name: '兼职家教', color: '#00FF00', hourlyRate: 100 })
console.log('添加项目2:', p2)

console.log('获取所有项目:', storageService.getProjects())

storageService.updateProject({ id: p1.id, name: '星湖花园装修' })
console.log('更新项目1后的列表:', storageService.getProjects())

// 测试记录管理
console.log('\n--- 测试工时记录管理 ---')
const r1 = storageService.addRecord({
  projectId: p1.id,
  projectName: p1.name,
  projectColor: p1.color,
  startTime: '2025-05-25 08:00:00',
  endTime: '2025-05-25 12:00:00',
  duration: 4,
  status: 'pending'
})
console.log('添加记录1:', r1)

const r2 = storageService.addRecord({
  projectId: p2.id,
  projectName: p2.name,
  projectColor: p2.color,
  startTime: '2025-05-25 14:00:00',
  endTime: '2025-05-25 16:00:00',
  duration: 2,
  status: 'pending'
})
console.log('添加记录2:', r2)

console.log('获取记录 (全部):', storageService.getRecords().length)
console.log('获取记录 (筛选项目1):', storageService.getRecords({ projectId: p1.id }).length)

storageService.markAsSettled(r1.id)
console.log('标记记录1为已结算:', storageService.getRecords({ status: 'settled' })[0].id === r1.id)

storageService.deleteRecord(r2.id)
console.log('删除记录2后的总数:', storageService.getRecords().length)

storageService.deleteProject(p1.id)
console.log('删除项目1后的项目数:', storageService.getProjects().length)
