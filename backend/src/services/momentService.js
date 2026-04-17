const { query, transaction } = require('../config/database');

/**
 * 心情动态服务
 * 处理动态发布、点赞、评论等社交功能
 */
class MomentService {
    /**
     * 获取动态列表
     * @param {number} page - 页码
     * @param {number} limit - 每页数量
     * @param {number|null} currentUserId - 当前用户ID（用于判断是否点赞）
     * @returns {Promise<{list: Array, total: number}>}
     */
    static async getMoments(page = 1, limit = 20, currentUserId = null) {
        const offset = (page - 1) * limit;

        // 获取动态列表（JOIN users 表获取用户信息，LEFT JOIN 获取评论数）
        const sql = `
            SELECT 
                m.id,
                m.user_id,
                m.content,
                m.emotion,
                m.likes_count,
                m.created_at,
                u.nickname,
                u.avatar,
                (SELECT COUNT(*) FROM moment_comments mc WHERE mc.moment_id = m.id) as comments_count,
                ${currentUserId ? `
                EXISTS(
                    SELECT 1 FROM moment_likes ml 
                    WHERE ml.moment_id = m.id AND ml.user_id = ?
                ) as is_liked` : 'FALSE as is_liked'}
            FROM moments m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const params = currentUserId ? [currentUserId, limit, offset] : [limit, offset];
        const list = await query(sql, params);

        // 获取总数
        const [countResult] = await query('SELECT COUNT(*) as total FROM moments');
        const total = countResult.total;

        return {
            list: list.map(item => ({
                id: item.id,
                userId: item.user_id,
                content: item.content,
                emotion: item.emotion,
                likesCount: item.likes_count,
                commentsCount: item.comments_count || 0,
                isLiked: item.is_liked === 1,
                createdAt: item.created_at,
                user: {
                    nickname: item.nickname,
                    avatar: item.avatar
                }
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * 发布动态
     * @param {number} userId - 用户ID
     * @param {string} content - 动态内容
     * @param {string} emotion - 情绪标签
     * @returns {Promise<Object>}
     */
    static async createMoment(userId, content, emotion) {
        const result = await query(
            'INSERT INTO moments (user_id, content, emotion) VALUES (?, ?, ?)',
            [userId, content, emotion || null]
        );

        // 获取刚创建的动态（包含用户信息）
        const [moment] = await query(`
            SELECT 
                m.id,
                m.user_id,
                m.content,
                m.emotion,
                m.likes_count,
                m.created_at,
                u.nickname,
                u.avatar
            FROM moments m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `, [result.insertId]);

        return {
            id: moment.id,
            userId: moment.user_id,
            content: moment.content,
            emotion: moment.emotion,
            likesCount: moment.likes_count,
            createdAt: moment.created_at,
            user: {
                nickname: moment.nickname,
                avatar: moment.avatar
            }
        };
    }

    /**
     * 删除动态
     * @param {number} userId - 用户ID
     * @param {number} momentId - 动态ID
     * @returns {Promise<boolean>}
     */
    static async deleteMoment(userId, momentId) {
        // 先检查动态是否存在且属于该用户
        const [moment] = await query(
            'SELECT user_id FROM moments WHERE id = ?',
            [momentId]
        );

        if (!moment) {
            throw new Error('动态不存在');
        }

        if (moment.user_id !== userId) {
            throw new Error('无权删除此动态');
        }

        // 使用事务删除动态及相关数据
        await transaction(async (connection) => {
            // 删除相关评论
            await connection.query(
                'DELETE FROM moment_comments WHERE moment_id = ?',
                [momentId]
            );
            // 删除相关点赞
            await connection.query(
                'DELETE FROM moment_likes WHERE moment_id = ?',
                [momentId]
            );
            // 删除动态
            await connection.query(
                'DELETE FROM moments WHERE id = ?',
                [momentId]
            );
        });

        return true;
    }

    /**
     * 点赞/取消点赞
     * @param {number} userId - 用户ID
     * @param {number} momentId - 动态ID
     * @returns {Promise<{liked: boolean, likesCount: number}>}
     */
    static async toggleLike(userId, momentId) {
        // 检查动态是否存在
        const [moment] = await query(
            'SELECT id FROM moments WHERE id = ?',
            [momentId]
        );

        if (!moment) {
            throw new Error('动态不存在');
        }

        // 检查是否已点赞
        const [existingLike] = await query(
            'SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?',
            [momentId, userId]
        );

        let liked;

        if (existingLike) {
            // 取消点赞
            await query(
                'DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?',
                [momentId, userId]
            );
            // 减少点赞数
            await query(
                'UPDATE moments SET likes_count = likes_count - 1 WHERE id = ?',
                [momentId]
            );
            liked = false;
        } else {
            // 添加点赞
            await query(
                'INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)',
                [momentId, userId]
            );
            // 增加点赞数
            await query(
                'UPDATE moments SET likes_count = likes_count + 1 WHERE id = ?',
                [momentId]
            );
            liked = true;
        }

        // 获取最新点赞数
        const [updatedMoment] = await query(
            'SELECT likes_count FROM moments WHERE id = ?',
            [momentId]
        );

        return {
            liked,
            likesCount: updatedMoment.likes_count
        };
    }

    /**
     * 获取评论列表
     * @param {number} momentId - 动态ID
     * @returns {Promise<Array>}
     */
    static async getComments(momentId) {
        // 检查动态是否存在
        const [moment] = await query(
            'SELECT id FROM moments WHERE id = ?',
            [momentId]
        );

        if (!moment) {
            throw new Error('动态不存在');
        }

        const comments = await query(`
            SELECT 
                c.id,
                c.moment_id,
                c.user_id,
                c.content,
                c.created_at,
                u.nickname,
                u.avatar
            FROM moment_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.moment_id = ?
            ORDER BY c.created_at ASC
        `, [momentId]);

        return comments.map(item => ({
            id: item.id,
            momentId: item.moment_id,
            userId: item.user_id,
            content: item.content,
            createdAt: item.created_at,
            user: {
                nickname: item.nickname,
                avatar: item.avatar
            }
        }));
    }

    /**
     * 添加评论
     * @param {number} userId - 用户ID
     * @param {number} momentId - 动态ID
     * @param {string} content - 评论内容
     * @returns {Promise<Object>}
     */
    static async addComment(userId, momentId, content) {
        // 检查动态是否存在
        const [moment] = await query(
            'SELECT id FROM moments WHERE id = ?',
            [momentId]
        );

        if (!moment) {
            throw new Error('动态不存在');
        }

        // 插入评论
        const result = await query(
            'INSERT INTO moment_comments (moment_id, user_id, content) VALUES (?, ?, ?)',
            [momentId, userId, content]
        );

        // 获取刚创建的评论（包含用户信息）
        const [comment] = await query(`
            SELECT 
                c.id,
                c.moment_id,
                c.user_id,
                c.content,
                c.created_at,
                u.nickname,
                u.avatar
            FROM moment_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        return {
            id: comment.id,
            momentId: comment.moment_id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: comment.created_at,
            user: {
                nickname: comment.nickname,
                avatar: comment.avatar
            }
        };
    }
}

module.exports = MomentService;
