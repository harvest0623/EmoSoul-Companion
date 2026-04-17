const { query } = require('../config/database');

/**
 * 情绪日记数据模型
 */
class EmotionDiaryModel {
    /**
     * 创建日记记录
     */
    static async create(userId, data) {
        const { date, emotion, intensity = 3, note = '', source = 'auto' } = data;
        const result = await query(
            'INSERT INTO emotion_diary (user_id, date, emotion, intensity, note, source) VALUES (?, ?, ?, ?, ?, ?)',
            [Number(userId), date, emotion, intensity, note, source]
        );
        return result.insertId;
    }

    /**
     * 按日期范围查询
     */
    static async findByDateRange(userId, startDate, endDate) {
        const results = await query(
            'SELECT * FROM emotion_diary WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY created_at DESC',
            [Number(userId), startDate, endDate]
        );
        return results;
    }

    /**
     * 获取某天的记录
     */
    static async findByDate(userId, date) {
        const results = await query(
            'SELECT * FROM emotion_diary WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
            [Number(userId), date]
        );
        return results;
    }

    /**
     * 获取某月的日历数据（每天的主要情绪）
     */
    static async getCalendarData(userId, year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        const results = await query(
            `SELECT date, emotion, AVG(intensity) as avg_intensity, COUNT(*) as count 
             FROM emotion_diary 
             WHERE user_id = ? AND date >= ? AND date <= ?
             GROUP BY date, emotion
             ORDER BY date, count DESC`,
            [Number(userId), startDate, endDate]
        );
        return results;
    }

    /**
     * 获取统计数据
     */
    static async getStats(userId, startDate, endDate) {
        const emotionDist = await query(
            `SELECT emotion, COUNT(*) as count, AVG(intensity) as avg_intensity 
             FROM emotion_diary 
             WHERE user_id = ? AND date >= ? AND date <= ?
             GROUP BY emotion
             ORDER BY count DESC`,
            [Number(userId), startDate, endDate]
        );

        const dailyTrend = await query(
            `SELECT date, emotion, AVG(intensity) as avg_intensity 
             FROM emotion_diary 
             WHERE user_id = ? AND date >= ? AND date <= ?
             GROUP BY date, emotion
             ORDER BY date ASC`,
            [Number(userId), startDate, endDate]
        );

        return { emotionDistribution: emotionDist, dailyTrend };
    }

    /**
     * 获取今天某用户的自动记录数量（防止重复）
     */
    static async getTodayAutoCount(userId) {
        const today = new Date().toISOString().split('T')[0];
        const rows = await query(
            'SELECT COUNT(*) as count FROM emotion_diary WHERE user_id = ? AND date = ? AND source = ?',
            [Number(userId), today, 'auto']
        );
        return rows[0].count;
    }

    /**
     * 删除日记记录
     */
    static async delete(id, userId) {
        const result = await query(
            'DELETE FROM emotion_diary WHERE id = ? AND user_id = ?',
            [Number(id), Number(userId)]
        );
        return result.affectedRows > 0;
    }
}

module.exports = EmotionDiaryModel;