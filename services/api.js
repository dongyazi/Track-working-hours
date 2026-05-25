const request = require('./request')

module.exports = {
  // 示例 API
  login: (data) => request.post('/auth/login', data),
  getWorkLogs: (params) => request.get('/work-logs', params),
  addWorkLog: (data) => request.post('/work-logs', data),
  getStats: (params) => request.get('/stats', params),
  
  // 用户相关
  getUserInfo: () => request.get('/user/info'),
  updateUserInfo: (data) => request.put('/user/info', data),
  
  // 项目相关
  getProjects: () => request.get('/projects'),
  addProject: (data) => request.post('/projects', data)
}
