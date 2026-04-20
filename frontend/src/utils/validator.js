/**
 * 表单验证工具
 */

export const validator = {
    // 验证手机号
    isPhone: (value) => {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(value);
    },

    // 验证邮箱
    isEmail: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },

    // 验证账号（手机号或邮箱）
    validateAccount: (value) => {
        if (!value) return { valid: false, message: '账号不能为空' };
        if (validator.isPhone(value) || validator.isEmail(value)) {
            return { valid: true, message: '' };
        }
        return { valid: false, message: '账号必须是手机号或邮箱格式' };
    },

    // 验证密码
    validatePassword: (value) => {
        if (!value) return { valid: false, message: '密码不能为空' };
        if (value.length < 8) return { valid: false, message: '密码长度至少8位' };
        if (!/[a-zA-Z]/.test(value)) return { valid: false, message: '密码必须包含字母' };
        if (!/\d/.test(value) && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return { valid: false, message: '密码必须包含数字或特殊字符' };
        }
        return { valid: true, message: '' };
    },

    // 验证昵称
    validateNickname: (value) => {
        if (!value) return { valid: false, message: '昵称不能为空' };
        if (value.length < 2) return { valid: false, message: '昵称至少2个字符' };
        if (value.length > 16) return { valid: false, message: '昵称最多16个字符' };
        return { valid: true, message: '' };
    },

    // 验证确认密码
    validateConfirmPassword: (password, confirmPassword) => {
        if (!confirmPassword) return { valid: false, message: '请确认密码' };
        if (password !== confirmPassword) return { valid: false, message: '两次密码输入不一致' };
        return { valid: true, message: '' };
    }
};

export default validator;