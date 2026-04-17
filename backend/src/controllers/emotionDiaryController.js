const EmotionDiaryService = require('../services/emotionDiaryService');
const ResponseUtil = require('../utils/response');

/**
 * 情绪日记控制器
 * 处理情绪日记相关的请求
 */
class EmotionDiaryController {
    /**
     * 获取日记列表
     * GET /api/diary
     */
    static async getDiary(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { startDate, endDate } = ctx.query;
            const entries = await EmotionDiaryService.getDiaryEntries(userId, startDate, endDate);
            ResponseUtil.success(ctx, entries, '获取成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }

    /**
     * 手动记录情绪
     * POST /api/diary
     */
    static async createEntry(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { emotion, intensity, note } = ctx.request.body;
            const entry = await EmotionDiaryService.createManualEntry(userId, { emotion, intensity, note });
            ResponseUtil.success(ctx, entry, '记录成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }

    /**
     * 获取统计数据
     * GET /api/diary/stats
     */
    static async getStats(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { period } = ctx.query;
            const stats = await EmotionDiaryService.getStats(userId, period || 'weekly');
            ResponseUtil.success(ctx, stats, '获取成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }

    /**
     * 获取日历数据
     * GET /api/diary/calendar
     */
    static async getCalendar(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { month } = ctx.query;
            if (!month) {
                ResponseUtil.badRequest(ctx, '缺少 month 参数（格式：2026-04）');
                return;
            }
            const calendar = await EmotionDiaryService.getCalendarData(userId, month);
            ResponseUtil.success(ctx, calendar, '获取成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }

    /**
     * 删除日记
     * DELETE /api/diary/:id
     */
    static async deleteEntry(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { id } = ctx.params;
            await EmotionDiaryService.deleteEntry(parseInt(id), userId);
            ResponseUtil.success(ctx, null, '删除成功');
        } catch (error) {
            ResponseUtil.error(ctx, error.message);
        }
    }
}

module.exports = EmotionDiaryController;