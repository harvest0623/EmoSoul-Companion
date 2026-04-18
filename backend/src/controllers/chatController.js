const ChatService = require('../services/chatService');
const ResponseUtil = require('../utils/response');

/**
 * 对话控制器
 * 处理数字人对话相关的请求
 */
class ChatController {
    /**
     * 发送消息
     * POST /api/chat/message
     */
    static async sendMessage(ctx) {
        const { userId } = ctx.state.user;
        const { message, mode = 'normal', facial_image } = ctx.request.body;

        // 调用扣子工作流（VIP上下文获取已移入 chatService 内部）
        const result = await ChatService.callCozeWorkflow(message, mode || 'normal', userId, facial_image || null);

        ResponseUtil.success(ctx, {
            id: result.id,
            response: result.response,
            reply: result.response,              // 前端 DigitalHuman 页面期望的字段
            expression: result.emotion,          // 前端 DigitalHuman 页面期望的字段
            emotion: result.emotion,
            intensity: result.intensity,
            emotion_advice: result.advice,
            lipSync: null,                       // 前端 DigitalHuman 页面期望的字段
            timestamp: result.timestamp
        }, '发送成功');
    }

    /**
     * 获取对话历史
     * GET /api/chat/history
     */
    static async getHistory(ctx) {
        const { userId } = ctx.state.user;
        const { limit = 50, offset = 0 } = ctx.query;

        const history = await ChatService.getConversationHistory(
            userId,
            parseInt(limit),
            parseInt(offset)
        );

        ResponseUtil.success(ctx, history);
    }

    /**
     * 轮询获取新消息
     * GET /api/chat/poll
     */
    static async pollMessages(ctx) {
        const { userId } = ctx.state.user;
        const { lastMessageId } = ctx.query;
        console.log('📨 pollMessages - userId from ctx:', userId, 'type:', typeof userId);

        const result = await ChatService.pollForResponse(userId, lastMessageId);

        ResponseUtil.success(ctx, result);
    }

    /**
     * 清空对话历史
     * DELETE /api/chat/history
     */
    static async clearHistory(ctx) {
        const { userId } = ctx.state.user;
        const ConversationModel = require('../models/conversationModel');

        await ConversationModel.deleteByUserId(userId);
        ResponseUtil.success(ctx, null, '对话历史已清空');
    }
}

module.exports = ChatController;