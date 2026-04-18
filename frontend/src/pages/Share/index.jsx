import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import './Share.css';

const Share = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();

    const [activeTab, setActiveTab] = useState('conversation');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [emotionCard, setEmotionCard] = useState({
        emotion: 'happy',
        message: '',
        color: '#3B82F6'
    });
    const [achievements, setAchievements] = useState([]);
    const [shareHistory, setShareHistory] = useState([]);

    // 模拟对话历史
    const conversations = [
        {
            id: 1,
            title: '关于梦想的对话',
            content: '我：我想成为一名作家\nAI：那是一个很棒的梦想！你想写什么类型的作品？\n我：我想写科幻小说\nAI：科幻小说是一个充满无限可能的领域。你有什么具体的想法吗？',
            timestamp: '2026-04-17 14:30'
        },
        {
            id: 2,
            title: '情绪支持对话',
            content: '我：今天心情不太好\nAI：我在这里倾听你。能告诉我发生了什么事吗？\n我：工作压力很大\nAI：工作压力确实会让人感到疲惫。你可以尝试一些放松的方法，比如深呼吸或短暂的休息。',
            timestamp: '2026-04-16 18:45'
        },
        {
            id: 3,
            title: '学习计划讨论',
            content: '我：我想学习编程\nAI：编程是一项很有价值的技能！你想从哪种语言开始？\n我：JavaScript\nAI：JavaScript是一个很好的选择，它用途广泛，适合初学者。',
            timestamp: '2026-04-15 10:20'
        }
    ];

    // 情绪选项
    const emotionOptions = [
        { id: 'happy', label: '开心', icon: '😊', color: '#3B82F6' },
        { id: 'sad', label: '难过', icon: '😢', color: '#10B981' },
        { id: 'angry', label: '愤怒', icon: '😠', color: '#EF4444' },
        { id: 'anxious', label: '焦虑', icon: '😰', color: '#F59E0B' },
        { id: 'excited', label: '兴奋', icon: '🤩', color: '#8B5CF6' },
        { id: 'calm', label: '平静', icon: '😌', color: '#06B6D4' }
    ];

    // 成就列表
    const allAchievements = [
        { id: 1, title: '初次对话', description: '完成第一次AI对话', icon: '💬', unlocked: true },
        { id: 2, title: '连续7天', description: '连续7天使用AI助手', icon: '🔥', unlocked: true },
        { id: 3, title: '内容创作者', description: '生成10篇创作内容', icon: '✍️', unlocked: false },
        { id: 4, title: '情绪管理', description: '使用情绪分析功能10次', icon: '😊', unlocked: true },
        { id: 5, title: '学习达人', description: '完成5个学习任务', icon: '📚', unlocked: false },
        { id: 6, title: '社交达人', description: '在社交连接中互动10次', icon: '🤝', unlocked: false }
    ];

    // 加载数据
    useEffect(() => {
        const savedAchievements = localStorage.getItem('shareAchievements');
        const savedShareHistory = localStorage.getItem('shareHistory');

        if (savedAchievements) {
            setAchievements(JSON.parse(savedAchievements));
        } else {
            setAchievements(allAchievements);
        }

        if (savedShareHistory) {
            setShareHistory(JSON.parse(savedShareHistory));
        }
    }, []);

    // 保存数据
    useEffect(() => {
        localStorage.setItem('shareAchievements', JSON.stringify(achievements));
    }, [achievements]);

    useEffect(() => {
        localStorage.setItem('shareHistory', JSON.stringify(shareHistory));
    }, [shareHistory]);

    // 分享对话
    const shareConversation = () => {
        if (!selectedConversation) {
            toast.error('请选择一个对话');
            return;
        }

        // 模拟分享过程
        setTimeout(() => {
            const shareItem = {
                id: Date.now(),
                type: 'conversation',
                title: selectedConversation.title,
                content: selectedConversation.content,
                timestamp: new Date().toLocaleString()
            };

            setShareHistory(prev => [shareItem, ...prev].slice(0, 10));
            toast.success('对话分享成功！');
        }, 1000);
    };

    // 生成情绪卡片
    const generateEmotionCard = () => {
        if (!emotionCard.message) {
            toast.error('请输入情绪留言');
            return;
        }

        // 模拟生成过程
        setTimeout(() => {
            const shareItem = {
                id: Date.now(),
                type: 'emotion',
                emotion: emotionCard.emotion,
                message: emotionCard.message,
                color: emotionCard.color,
                timestamp: new Date().toLocaleString()
            };

            setShareHistory(prev => [shareItem, ...prev].slice(0, 10));
            toast.success('情绪卡片生成成功！');
        }, 1000);
    };

    // 分享成就
    const shareAchievement = (achievement) => {
        if (!achievement.unlocked) {
            toast.error('该成就尚未解锁');
            return;
        }

        // 模拟分享过程
        setTimeout(() => {
            const shareItem = {
                id: Date.now(),
                type: 'achievement',
                achievementId: achievement.id,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                timestamp: new Date().toLocaleString()
            };

            setShareHistory(prev => [shareItem, ...prev].slice(0, 10));
            toast.success('成就分享成功！');
        }, 1000);
    };

    // 复制到剪贴板
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('已复制到剪贴板');
        }).catch(() => {
            toast.error('复制失败');
        });
    };

    return (
        <div className={`share-page ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="content-header share-header">
                <button className="content-back-btn share-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="content-title share-title">📤 分享功能</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 标签切换 */}
            <div className="share-tabs">
                <button
                    className={`share-tab ${activeTab === 'conversation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('conversation')}
                >
                    <span className="share-tab-icon">💬</span>
                    对话分享
                </button>
                <button
                    className={`share-tab ${activeTab === 'emotion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('emotion')}
                >
                    <span className="share-tab-icon">😊</span>
                    情绪卡片
                </button>
                <button
                    className={`share-tab ${activeTab === 'achievement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('achievement')}
                >
                    <span className="share-tab-icon">🏆</span>
                    成就系统
                </button>
            </div>

            <div className="share-content">
                {/* 对话分享 */}
                {activeTab === 'conversation' && (
                    <div className="share-card">
                        <h3>💬 对话分享</h3>
                        <div className="conversation-list">
                            {conversations.map(conversation => (
                                <div
                                    key={conversation.id}
                                    className={`conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedConversation(conversation)}
                                >
                                    <div className="conversation-header">
                                        <h4>{conversation.title}</h4>
                                        <span className="conversation-time">{conversation.timestamp}</span>
                                    </div>
                                    <div className="conversation-preview">
                                        {conversation.content.substring(0, 100)}...
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedConversation && (
                            <div className="selected-conversation">
                                <h4>选中的对话</h4>
                                <div className="conversation-content">
                                    {selectedConversation.content.split('\n').map((line, index) => (
                                        <div key={index} className="conversation-line">{line}</div>
                                    ))}
                                </div>
                                <div className="conversation-actions">
                                    <button
                                        className="share-btn share-btn-primary"
                                        onClick={shareConversation}
                                    >
                                        分享对话
                                    </button>
                                    <button
                                        className="share-btn share-btn-secondary"
                                        onClick={() => copyToClipboard(selectedConversation.content)}
                                    >
                                        复制内容
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 情绪卡片 */}
                {activeTab === 'emotion' && (
                    <div className="share-card">
                        <h3>😊 情绪卡片生成</h3>
                        <div className="emotion-selector">
                            <h4>选择情绪</h4>
                            <div className="emotion-options">
                                {emotionOptions.map(emotion => (
                                    <div
                                        key={emotion.id}
                                        className={`emotion-item ${emotionCard.emotion === emotion.id ? 'selected' : ''}`}
                                        style={{ borderColor: emotion.color }}
                                        onClick={() => setEmotionCard(prev => ({ ...prev, emotion: emotion.id, color: emotion.color }))}
                                    >
                                        <span className="emotion-icon">{emotion.icon}</span>
                                        <span className="emotion-label">{emotion.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="emotion-message">
                            <h4>情绪留言</h4>
                            <textarea
                                className="share-textarea"
                                placeholder="输入你的情绪感受..."
                                value={emotionCard.message}
                                onChange={e => setEmotionCard(prev => ({ ...prev, message: e.target.value }))}
                                rows={4}
                            />
                        </div>

                        <div className="emotion-card-preview">
                            <h4>卡片预览</h4>
                            <div className="emotion-card" style={{ borderColor: emotionCard.color }}>
                                <div className="emotion-card-header" style={{ backgroundColor: emotionCard.color }}>
                                    {emotionOptions.find(e => e.id === emotionCard.emotion)?.icon}
                                </div>
                                <div className="emotion-card-content">
                                    <p>{emotionCard.message || '输入你的情绪感受...'}</p>
                                </div>
                                <div className="emotion-card-footer">
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="emotion-actions">
                            <button
                                className="share-btn share-btn-primary"
                                onClick={generateEmotionCard}
                            >
                                生成情绪卡片
                            </button>
                        </div>
                    </div>
                )}

                {/* 成就系统 */}
                {activeTab === 'achievement' && (
                    <div className="share-card">
                        <h3>🏆 成就系统</h3>
                        <div className="achievements-grid">
                            {achievements.map(achievement => (
                                <div key={achievement.id} className={`achievement-item ${achievement.unlocked ? '' : 'locked'}`}>
                                    <div className="achievement-icon">{achievement.icon}</div>
                                    <h4 className="achievement-title">{achievement.title}</h4>
                                    <p className="achievement-description">{achievement.description}</p>
                                    <button
                                        className="share-btn share-btn-primary"
                                        onClick={() => shareAchievement(achievement)}
                                        disabled={!achievement.unlocked}
                                    >
                                        {achievement.unlocked ? '分享成就' : '未解锁'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 分享历史 */}
                {shareHistory.length > 0 && (
                    <div className="share-card">
                        <h3>📋 分享历史</h3>
                        <div className="share-history-list">
                            {shareHistory.map(item => (
                                <div key={item.id} className="share-history-item">
                                    <div className="share-history-header">
                                        <span className="share-history-type">
                                            {item.type === 'conversation' && '💬 对话'}
                                            {item.type === 'emotion' && '😊 情绪卡片'}
                                            {item.type === 'achievement' && '🏆 成就'}
                                        </span>
                                        <span className="share-history-time">{item.timestamp}</span>
                                    </div>
                                    <div className="share-history-content">
                                        {item.type === 'conversation' && (
                                            <p>{item.title}</p>
                                        )}
                                        {item.type === 'emotion' && (
                                            <p>{item.message}</p>
                                        )}
                                        {item.type === 'achievement' && (
                                            <p>{item.title}: {item.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Share;