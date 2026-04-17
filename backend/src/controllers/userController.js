const UserService = require('../services/userService');
const ResponseUtil = require('../utils/response');

/**
 * 用户控制器
 * 处理用户信息相关的请求
 */
class UserController {
    /**
     * 获取当前用户信息
     * GET /api/user/profile
     */
    static async getProfile(ctx) {
        const { userId } = ctx.state.user;
        const user = await UserService.getUserInfo(userId);
        ResponseUtil.success(ctx, user);
    }

    /**
     * 更新昵称
     * PUT /api/user/nickname
     */
    static async updateNickname(ctx) {
        const { userId } = ctx.state.user;
        const { nickname } = ctx.request.body;

        const user = await UserService.updateNickname(userId, nickname);
        ResponseUtil.success(ctx, user, '昵称修改成功');
    }

    /**
     * 更新头像
     * PUT /api/user/avatar
     */
    static async updateAvatar(ctx) {
        const { userId } = ctx.state.user;
        const { avatar } = ctx.request.body;

        if (!avatar) {
            ResponseUtil.badRequest(ctx, '头像数据不能为空');
            return;
        }

        const user = await UserService.updateAvatar(userId, avatar);
        ResponseUtil.success(ctx, user, '头像更新成功');
    }

    /**
     * 修改密码
     * PUT /api/user/password
     */
    static async updatePassword(ctx) {
        const { userId } = ctx.state.user;
        const { oldPassword, newPassword } = ctx.request.body;

        await UserService.updatePassword(userId, oldPassword, newPassword);
        ResponseUtil.success(ctx, null, '密码修改成功');
    }

    /**
     * 获取数字人设置
     * GET /api/user/companion
     */
    static async getCompanionSettings(ctx) {
        const { userId } = ctx.state.user;
        const settings = await UserService.getCompanionSettings(userId);
        ResponseUtil.success(ctx, settings, '获取成功');
    }

    /**
     * 更新数字人设置
     * PUT /api/user/companion
     */
    static async updateCompanionSettings(ctx) {
        const { userId } = ctx.state.user;
        const { companion_name, companion_personality, chat_style } = ctx.request.body;
        const settings = await UserService.updateCompanionSettings(userId, {
            companion_name, companion_personality, chat_style
        });
        ResponseUtil.success(ctx, settings, '更新成功');
    }
}

module.exports = UserController;