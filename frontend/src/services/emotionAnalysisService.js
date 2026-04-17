import axios from 'axios';
import request from '../utils/request';

// 独立的静默 axios 实例，不触发全局 toast 错误提示
const silentRequest = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 静默请求也带上 token
silentRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 情绪识别分析 API
 */
export const emotionAnalysisApi = {
  // 检查 Python 推理服务健康状态（静默，不弹 toast）
  checkHealth: () => {
    return silentRequest.get('/emotion-analysis/health')
      .then(res => res.data)
      .catch(() => ({ code: 200, data: { status: 'offline' } }));
  },

  // 启动 Python 推理服务（静默，不弹 toast）
  startService: () => {
    return silentRequest.post('/emotion-analysis/start-service')
      .then(res => res.data)
      .catch(() => null);
  },

  // 发送视频帧进行情绪分析
  analyzeFrame: (data) => {
    return request.post('/emotion-analysis/analyze', data, {
      timeout: 15000,
    });
  },

  // 获取情绪历史记录
  getHistory: (params = {}) => {
    return request.get('/emotion-analysis/history', { params });
  },
};

export default emotionAnalysisApi;
