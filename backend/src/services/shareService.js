const { query } = require('../config/database');

// 成就定义
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
  // 获取用户成就
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

  // 检查并解锁成就
  async checkAchievements(userId) {
    // 1. 先获取已解锁的成就列表
    const unlocked = await query(
      'SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ?',
      [userId]
    );
    const unlockedMap = {};
    unlocked.forEach(a => { unlockedMap[a.achievement_key] = a.unlocked_at; });

    // 2. 检查条件，对新满足条件的进行解锁
    const newlyUnlocked = [];
    
    // 检查对话次数成就
    const chatCount = await query(
      'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?',
      [userId]
    );
    const chats = chatCount[0].count;
    if (chats >= 1) await this._tryUnlock(userId, 'first_chat', newlyUnlocked, unlockedMap);
    if (chats >= 10) await this._tryUnlock(userId, 'chat_10', newlyUnlocked, unlockedMap);
    if (chats >= 100) await this._tryUnlock(userId, 'chat_100', newlyUnlocked, unlockedMap);

    // 检查待办完成数
    const todoCount = await query(
      'SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND completed = 1',
      [userId]
    );
    if (todoCount[0].count >= 20) await this._tryUnlock(userId, 'todo_master', newlyUnlocked, unlockedMap);

    // 检查动态发布数
    const momentCount = await query(
      'SELECT COUNT(*) as count FROM moments WHERE user_id = ?',
      [userId]
    );
    if (momentCount[0].count >= 10) await this._tryUnlock(userId, 'social_butterfly', newlyUnlocked, unlockedMap);

    // 检查情绪种类（从emotion_diary或conversations）
    try {
      const emotions = await query(
        'SELECT DISTINCT emotion FROM emotion_diary WHERE user_id = ?',
        [userId]
      );
      if (emotions.length >= 8) await this._tryUnlock(userId, 'mood_explorer', newlyUnlocked, unlockedMap);
    } catch (e) {
      // emotion_diary 表可能不存在，忽略
      console.error('检查情绪种类失败:', e.message);
    }

    // 3. 获取所有成就列表（含解锁状态）
    const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => ({
      key,
      ...def,
      unlocked: !!unlockedMap[key],
      unlockedAt: unlockedMap[key] || null
    }));

    // 返回完整结构
    return {
      achievements: allAchievements,
      newlyUnlocked: newlyUnlocked.map(item => ({ key: item.key }))
    };
  }

  async _tryUnlock(userId, key, list, unlockedMap) {
    // 如果已经解锁过，直接跳过
    if (unlockedMap[key]) {
      return;
    }

    try {
      // 尝试插入新成就
      const result = await query(
        'INSERT INTO achievements (user_id, achievement_key) VALUES (?, ?)',
        [userId, key]
      );
      
      // 如果插入成功（affectedRows > 0），说明是新解锁的
      if (result.affectedRows > 0) {
        const def = ACHIEVEMENT_DEFINITIONS[key];
        list.push({ key, ...def });
        // 更新已解锁映射
        unlockedMap[key] = new Date().toISOString();
      }
    } catch (e) {
      // 忽略重复插入错误（可能是并发情况）
      if (e.code !== 'ER_DUP_ENTRY') {
        console.error('解锁成就失败:', e.message);
      }
    }
  }
}

module.exports = new ShareService();
