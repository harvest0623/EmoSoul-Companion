const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('缺少环境变量 JWT_SECRET，请在 backend/.env 中配置（可参考 .env.example）');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_EXPIRES_IN_REMEMBER = process.env.JWT_EXPIRES_IN_REMEMBER || '30d';

/**
 * JWT工具类
 */
class JWTUtil {
    /**
     * 生成Token
     * @param {Object} payload - 负载数据
     * @param {boolean} rememberMe - 是否记住我
     * @returns {string} Token
     */
    static generateToken(payload, rememberMe = false) {
        const expiresIn = rememberMe ? JWT_EXPIRES_IN_REMEMBER : JWT_EXPIRES_IN;
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
    }

    /**
     * 验证Token
     * @param {string} token - Token字符串
     * @returns {Object|null} 解码后的数据或null
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * 检查Token是否在黑名单中
     * @param {string} token - Token字符串
     * @returns {Promise<boolean>}
     */
    static async isTokenBlacklisted(token) {
        const results = await query(
            'SELECT * FROM token_blacklist WHERE token = ? AND expired_at > NOW()',
            [token]
        );
        return results.length > 0;
    }

    /**
     * 将Token加入黑名单
     * @param {string} token - Token字符串
     * @returns {Promise<void>}
     */
    static async blacklistToken(token) {
        const decoded = this.verifyToken(token);
        if (!decoded) return;

        const expiredAt = new Date(decoded.exp * 1000);
        await query(
            'INSERT INTO token_blacklist (token, expired_at) VALUES (?, ?)',
            [token, expiredAt]
        );
    }

    /**
     * 清理过期的Token黑名单记录
     * @returns {Promise<void>}
     */
    static async cleanExpiredTokens() {
        await query('DELETE FROM token_blacklist WHERE expired_at <= NOW()');
    }
}

module.exports = JWTUtil;