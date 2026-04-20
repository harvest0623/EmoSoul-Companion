const { query } = require('../config/database');

const ACHIEVEMENT_DEFINITIONS = {
    first_chat: { name: '初次对话', description: '完成第一次对话', icon: '💬' },
    chat_10: { name: '话唠达人', description: '完成10次对话', icon: '🗣️' },
    chat_100: { name: '知心好友', description: '完成100次对话', icon: '💝' },
    diary_7: { name: '日记达人', description: '连续7天写日记', icon: '📔' },
    mood_explorer: { name: '情绪探索家', description: '体验全部8种情绪', icon: '🌈' },
    todo_master: { name: '效率达人', description: '完成20个待办事项', icon: '✅' },
    social_butterfly: { name: '社交达人', description: '发布10条动态', icon: '🦋' },
    creative_writer: { name: '创作新星', description: '使用创作模式5次', icon: '✍️' }
};

class ShareService {
    async getAchievements(userId) {
        const unlocked = await query(
            'SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ?',
            [userId]
        );

        const unlockedMap = {};
        unlocked.forEach(a => { unlockedMap[a.achievement_key] = a.unlocked_at; });

        return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => ({
            key,
            ...def,
            unlocked: !!unlockedMap[key],
            unlocked_at: unlockedMap[key] || null
        }));
    }

    async checkAchievements(userId) {
        const unlocked = await query(
            'SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ?',
            [userId]
        );
        const unlockedMap = {};
        unlocked.forEach(a => { unlockedMap[a.achievement_key] = a.unlocked_at; });

        const newlyUnlocked = [];

        const chatCount = await query(
            'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?',
            [userId]
        );
        const chats = chatCount[0].count;
        if (chats >= 1) await this._tryUnlock(userId, 'first_chat', newlyUnlocked, unlockedMap);
        if (chats >= 10) await this._tryUnlock(userId, 'chat_10', newlyUnlocked, unlockedMap);
        if (chats >= 100) await this._tryUnlock(userId, 'chat_100', newlyUnlocked, unlockedMap);

        const todoCount = await query(
            'SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND completed = 1',
            [userId]
        );
        if (todoCount[0].count >= 20) await this._tryUnlock(userId, 'todo_master', newlyUnlocked, unlockedMap);

        const momentCount = await query(
            'SELECT COUNT(*) as count FROM moments WHERE user_id = ?',
            [userId]
        );
        if (momentCount[0].count >= 10) await this._tryUnlock(userId, 'social_butterfly', newlyUnlocked, unlockedMap);

        try {
            const emotions = await query(
                'SELECT DISTINCT emotion FROM emotion_diary WHERE user_id = ?',
                [userId]
            );
            if (emotions.length >= 8) await this._tryUnlock(userId, 'mood_explorer', newlyUnlocked, unlockedMap);
        } catch (e) {
            console.error('检查情绪种类失败:', e.message);
        }

        const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => ({
            key,
            ...def,
            unlocked: !!unlockedMap[key],
            unlockedAt: unlockedMap[key] || null
        }));

        return {
            achievements: allAchievements,
            newlyUnlocked: newlyUnlocked.map(item => ({ key: item.key }))
        };
    }

    async _tryUnlock(userId, key, list, unlockedMap) {
        if (unlockedMap[key]) {
            return;
        }

        try {
            const result = await query(
                'INSERT INTO achievements (user_id, achievement_key) VALUES (?, ?)',
                [userId, key]
            );

            if (result.affectedRows > 0) {
                const def = ACHIEVEMENT_DEFINITIONS[key];
                list.push({ key, ...def });
                unlockedMap[key] = new Date().toISOString();
            }
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') {
                console.error('解锁成就失败:', e.message);
            }
        }
    }
}

module.exports = new ShareService();
