import request from '../utils/request';

/**
 * 对话相关API
 */
export const chatApi = {
    // 发送消息
    sendMessage: (message, facialImage, mode = 'normal') => {
        const data = { message, mode };
        if (facialImage) {
            data.facial_image = facialImage;
        }
        return request.post('/chat/message', data);
    },

    // 获取对话历史
    getHistory: (params = {}) => {
        return request.get('/chat/history', { params });
    },

    // 轮询获取新消息
    pollMessages: (lastMessageId) => {
        return request.get('/chat/poll', {
            params: { lastMessageId }
        });
    },

    // 清空对话历史
    clearHistory: () => {
        return request.delete('/chat/history');
    }
};

export default chatApi;