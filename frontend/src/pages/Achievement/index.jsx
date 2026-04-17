import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import achievementApi from '../../services/achievementService';
import useThemeStore from '../../store/themeStore';
import './Achievement.css';

// 成就配置（与后端一致）
const ACHIEVEMENTS_CONFIG = [
  {
    id: 'first_chat',
    name: '初次对话',
    description: '完成第一次AI对话',
    icon: '💬',
    color: '#10B981',
    maxProgress: 1,
  },
  {
    id: 'chat_10',
    name: '话匣子',
    description: '累计完成10次对话',
    icon: '🗣️',
    color: '#3B82F6',
    maxProgress: 10,
  },
  {
    id: 'chat_100',
    name: '知心好友',
    description: '累计完成100次对话',
    icon: '💝',
    color: '#8B5CF6',
    maxProgress: 100,
  },
  {
    id: 'diary_7',
    name: '周记达人',
    description: '连续7天记录情绪日记',
    icon: '📝',
    color: '#F59E0B',
    maxProgress: 7,
  },
  {
    id: 'mood_explorer',
    name: '情绪探索家',
    description: '体验所有情绪类型',
    icon: '🎭',
    color: '#EC4899',
    maxProgress: 8,
  },
  {
    id: 'todo_master',
    name: '效率大师',
    description: '完成20个待办事项',
    icon: '✅',
    color: '#14B8A6',
    maxProgress: 20,
  },
  {
    id: 'social_butterfly',
    name: '社交达人',
    description: '发布10条动态',
    icon: '🦋',
    color: '#6366F1',
    maxProgress: 10,
  },
  {
    id: 'creative_writer',
    name: '创意写手',
    description: '使用创意模式完成5次对话',
    icon: '✨',
    color: '#F97316',
    maxProgress: 5,
  },
];

/**
 * 成就墙页面
 */
const Achievement = () => {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();

  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  // 加载成就数据
  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      const result = await achievementApi.getAchievements();
      if (result.code === 200) {
        setAchievements(result.data || []);
      }
    } catch (error) {
      toast.error('加载成就失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查新成就
  const checkNewAchievements = async () => {
    try {
      const result = await achievementApi.checkAchievements();
      if (result.code === 200 && result.data?.newlyUnlocked?.length > 0) {
        const newIds = result.data.newlyUnlocked.map(a => a.key);
        setNewlyUnlocked(newIds);
        toast.success(`解锁了 ${newIds.length} 个新成就！`);
        // 重新加载成就列表
        loadAchievements();
        // 3秒后清除高亮动画
        setTimeout(() => setNewlyUnlocked([]), 3000);
      }
    } catch (error) {
      console.error('检查成就失败:', error);
    }
  };

  useEffect(() => {
    // 先检查新成就，再加载列表
    checkNewAchievements();
    loadAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 合并配置和解锁状态
  const achievementsWithStatus = ACHIEVEMENTS_CONFIG.map(config => {
    const unlocked = achievements.find(a => a.key === config.id);
    return {
      ...config,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlocked_at,
    };
  });

  const unlockedCount = achievementsWithStatus.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS_CONFIG.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`achievement-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="achievement-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span className="iconfont icon-fanhui"></span>
        </button>
        <h1>我的成就</h1>
        <div className="header-placeholder"></div>
      </header>

      <div className="achievement-content">
        {/* 进度统计区域 */}
        <div className="achievement-progress-section">
          <div className="progress-stats">
            <span className="progress-text">已解锁 {unlockedCount}/{totalCount}</span>
            <span className="progress-percent">{progressPercent}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 成就网格 */}
        <div className="achievement-grid">
          {achievementsWithStatus.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-card ${
                achievement.unlocked ? 'unlocked' : 'locked'
              } ${newlyUnlocked.includes(achievement.id) ? 'newly-unlocked' : ''}`}
            >
              {/* 锁图标覆盖层 */}
              {!achievement.unlocked && (
                <div className="lock-overlay">
                  <span className="lock-icon iconfont icon-suoding"></span>
                </div>
              )}

              {/* 新解锁标记 */}
              {newlyUnlocked.includes(achievement.id) && (
                <div className="new-badge">NEW</div>
              )}

              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-name">{achievement.name}</div>
              <div className="achievement-desc">{achievement.description}</div>
              
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="achievement-date">
                  {formatDate(achievement.unlockedAt)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 空状态提示 */}
        {unlockedCount === 0 && (
          <div className="achievement-empty">
            <span className="empty-icon">🏆</span>
            <p>还没有解锁任何成就</p>
            <span className="empty-hint">开始聊天、记录情绪来解锁成就吧~</span>
          </div>
        )}
      </div>

      {isLoading && <div className="achievement-loading">加载中...</div>}
    </div>
  );
};

export default Achievement;
