import request from '../utils/request';

/**
 * 情绪日记相关API
 */
export const diaryApi = {
    // 获取日记列表
    getDiary: (startDate, endDate) => {
        return request.get('/diary', { params: { startDate, endDate } });
    },

    // 手动记录情绪
    createEntry: (data) => {
        return request.post('/diary', data);
    },

    // 获取统计数据
    getStats: (period = 'weekly') => {
        return request.get('/diary/stats', { params: { period } });
    },

    // 获取日历数据
    getCalendar: (month) => {
        return request.get('/diary/calendar', { params: { month } });
    },

    // 删除日记
    deleteEntry: (id) => {
        return request.delete(`/diary/${id}`);
    }
};

export default diaryApi;