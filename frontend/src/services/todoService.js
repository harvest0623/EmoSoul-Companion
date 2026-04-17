import request from '../utils/request';

/**
 * 待办事项相关API
 */
const todoApi = {
  getTodos: (completed) => {
    const params = completed !== undefined ? `?completed=${completed}` : '';
    return request.get(`/todos${params}`);
  },
  createTodo: (data) => request.post('/todos', data),
  updateTodo: (id, data) => request.put(`/todos/${id}`, data),
  deleteTodo: (id) => request.delete(`/todos/${id}`),
};

export default todoApi;
