/**
 * 本地存储工具
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const storage = {
    // Token操作
    setToken: (token) => {
        localStorage.setItem(TOKEN_KEY, token);
    },

    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },

    removeToken: () => {
        localStorage.removeItem(TOKEN_KEY);
    },

    // 用户信息操作
    setUser: (user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    removeUser: () => {
        localStorage.removeItem(USER_KEY);
    },

    // 清除所有
    clear: () => {
        localStorage.clear();
    }
};

export default storage;