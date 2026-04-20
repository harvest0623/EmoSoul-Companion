import request from '../utils/request';

/**
 * 用户相关API
 */
export const userApi = {
    // 获取用户信息
    getProfile: () => {
        return request.get('/user/profile');
    },

    // 更新昵称
    updateNickname: (nickname) => {
        return request.put('/user/nickname', { nickname });
    },

    // 更新头像
    updateAvatar: (avatar) => {
        return request.put('/user/avatar', { avatar });
    },

    // 修改密码
    updatePassword: (oldPassword, newPassword) => {
        return request.put('/user/password', { oldPassword, newPassword });
    },

    // 获取数字人设置
    getCompanionSettings: () => {
        return request.get('/user/companion');
    },

    // 更新数字人设置
    updateCompanionSettings: (data) => {
        return request.put('/user/companion', data);
    }
};

export default userApi;