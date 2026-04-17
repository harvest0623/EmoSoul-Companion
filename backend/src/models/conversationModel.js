const { query } = require('../config/database');

/**
 * 对话数据模型
 */
class ConversationModel {
    /**
     * 创建对话记录
     */
    static async create({ userId, message, response, emotion = 'gentle', source = 'user' }) {
        const result = await query(
            'INSERT INTO conversations (user_id, message, response, emotion, source) VALUES (?, ?, ?, ?, ?)',
            [Number(userId), message, response, emotion, source]
        );
        return { id: result.insertId };
    }

    /**
     * 获取用户的对话历史
     */
    static async getHistoryByUserId(userId, limit = 50, offset = 0) {
        const params = [Number(userId), Number(limit), Number(offset)];
        console.log('📊 SQL params:', params, 'types:', params.map(p => typeof p));
        const results = await query(
            `SELECT id, message, response, emotion, source, created_at 
            FROM conversations 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?`,
            params
        );
        return results.reverse(); // 按时间正序返回
    }

    /**
     * 获取最近的对话上下文
     */
    static async getRecentContext(userId, limit = 10) {
        const results = await query(
            `SELECT message, response, emotion 
            FROM conversations 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?`,
            [Number(userId), Number(limit)]
        );
        return results.reverse();
    }

    /**
     * 删除用户的所有对话记录
     */
    static async deleteByUserId(userId) {
        const result = await query(
            'DELETE FROM conversations WHERE user_id = ?',
            [Number(userId)]
        );
        return { changes: result.affectedRows };
    }

    /**
     * 删除超过1个月的过期对话记录
     */
    static async deleteExpired() {
        const result = await query(
            'DELETE FROM conversations WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)'
        );
        return { deletedCount: result.affectedRows };
    }
}

module.exports = ConversationModel;