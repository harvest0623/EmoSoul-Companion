const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * 加密工具类
 */
class CryptoUtil {
    /**
       * 密码加密
       * @param {string} password - 明文密码
       * @returns {Promise<string>} 加密后的密码
       */
    static async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    /**
     * 密码验证
     * @param {string} password - 明文密码
     * @param {string} hash - 加密后的密码
     * @returns {Promise<boolean>} 是否匹配
     */
    static async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

module.exports = CryptoUtil;