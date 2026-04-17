import request from '../utils/request';

const momentApi = {
  getMoments: (page = 1, limit = 20) => request.get(`/moments?page=${page}&limit=${limit}`),
  createMoment: (data) => request.post('/moments', data),
  deleteMoment: (id) => request.delete(`/moments/${id}`),
  toggleLike: (id) => request.post(`/moments/${id}/like`),
  getComments: (id) => request.get(`/moments/${id}/comments`),
  addComment: (id, content) => request.post(`/moments/${id}/comments`, { content }),
};

export default momentApi;
