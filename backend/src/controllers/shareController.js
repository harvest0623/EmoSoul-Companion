const ShareService = require('../services/shareService');
const ResponseUtil = require('../utils/response');

/**
 * 分享与成就控制器
 * 处理用户成就相关请求
 */
class ShareController {
    /**
     * 获取用户成就列表
     * GET /api/achievements
     */
    static async getAchievements(ctx) {
        try {
            const { userId } = ctx.state.user;
            const achievements = await ShareService.getAchievements(userId);
            ResponseUtil.success(ctx, achievements, '获取成就列表成功');
        } catch (error) {
            console.error('获取成就列表失败:', error);
            ResponseUtil.error(ctx, '获取成就列表失败', 500);
        }
    }

    /**
     * 检查并解锁成就
     * POST /api/achievements/check
     */
    static async checkAchievements(ctx) {
        try {
            const { userId } = ctx.state.user;
            const newlyUnlocked = await ShareService.checkAchievements(userId);
            ResponseUtil.success(ctx, newlyUnlocked, '成就检查完成');
        } catch (error) {
            console.error('检查成就失败:', error);
            ResponseUtil.error(ctx, '检查成就失败', 500);
        }
    }
}

module.exports = ShareController;
