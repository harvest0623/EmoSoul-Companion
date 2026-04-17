const MomentService = require('../services/momentService');
const ResponseUtil = require('../utils/response');

/**
 * 心情动态控制器
 * 处理动态发布、点赞、评论等社交功能的请求
 */
class MomentController {
    /**
     * 获取动态列表
     * GET /api/moments?page=1&limit=20
     */
    static async getMoments(ctx) {
        try {
            const { userId } = ctx.state.user;
            const page = parseInt(ctx.query.page) || 1;
            const limit = parseInt(ctx.query.limit) || 20;

            const result = await MomentService.getMoments(page, limit, userId);
            ResponseUtil.success(ctx, result, '获取成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }

    /**
     * 发布动态
     * POST /api/moments
     * Body: { content, emotion }
     */
    static async createMoment(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { content, emotion } = ctx.request.body;

            if (!content || content.trim() === '') {
                ResponseUtil.badRequest(ctx, '动态内容不能为空');
                return;
            }

            if (content.length > 1000) {
                ResponseUtil.badRequest(ctx, '动态内容不能超过1000字');
                return;
            }

            const moment = await MomentService.createMoment(userId, content.trim(), emotion);
            ResponseUtil.success(ctx, moment, '发布成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }

    /**
     * 删除动态
     * DELETE /api/moments/:id
     */
    static async deleteMoment(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { id } = ctx.params;

            await MomentService.deleteMoment(userId, parseInt(id));
            ResponseUtil.success(ctx, null, '删除成功');
        } catch (error) {
            if (error.message === '动态不存在') {
                ResponseUtil.notFound(ctx, error.message);
            } else if (error.message === '无权删除此动态') {
                ResponseUtil.forbidden(ctx, error.message);
            } else {
                ResponseUtil.error(ctx, error.message);
            }
        }
    }

    /**
     * 点赞/取消点赞
     * POST /api/moments/:id/like
     */
    static async toggleLike(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { id } = ctx.params;

            const result = await MomentService.toggleLike(userId, parseInt(id));
            ResponseUtil.success(ctx, result, result.liked ? '点赞成功' : '取消点赞成功');
        } catch (error) {
            if (error.message === '动态不存在') {
                ResponseUtil.notFound(ctx, error.message);
            } else {
                ResponseUtil.error(ctx, error.message);
            }
        }
    }

    /**
     * 获取评论列表
     * GET /api/moments/:id/comments
     */
    static async getComments(ctx) {
        try {
            const { id } = ctx.params;

            const comments = await MomentService.getComments(parseInt(id));
            ResponseUtil.success(ctx, comments, '获取成功');
        } catch (error) {
            if (error.message === '动态不存在') {
                ResponseUtil.notFound(ctx, error.message);
            } else {
                ResponseUtil.error(ctx, error.message);
            }
        }
    }

    /**
     * 添加评论
     * POST /api/moments/:id/comments
     * Body: { content }
     */
    static async addComment(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { id } = ctx.params;
            const { content } = ctx.request.body;

            if (!content || content.trim() === '') {
                ResponseUtil.badRequest(ctx, '评论内容不能为空');
                return;
            }

            if (content.length > 500) {
                ResponseUtil.badRequest(ctx, '评论内容不能超过500字');
                return;
            }

            const comment = await MomentService.addComment(userId, parseInt(id), content.trim());
            ResponseUtil.success(ctx, comment, '评论成功');
        } catch (error) {
            if (error.message === '动态不存在') {
                ResponseUtil.notFound(ctx, error.message);
            } else {
                ResponseUtil.error(ctx, error.message);
            }
        }
    }
}

module.exports = MomentController;
