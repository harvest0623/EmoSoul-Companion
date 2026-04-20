import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';
import './SocialConnection.css';

const SocialConnection = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();
    const [selectedTab, setSelectedTab] = useState('friends');
    const [activeCommunity, setActiveCommunity] = useState(null);
    const [postContent, setPostContent] = useState('');
    const [showPostModal, setShowPostModal] = useState(false);

    // 虚拟朋友圈数据
    const friendsPosts = [
        {
            id: 1,
            name: '小明',
            avatar: '👨‍💻',
            content: '今天完成了一个重要的项目，感觉很有成就感！',
            time: '2小时前',
            likes: 24,
            comments: 5
        },
        {
            id: 2,
            name: '小红',
            avatar: '👩‍🎨',
            content: '分享一下我的最新画作，希望大家喜欢！',
            time: '5小时前',
            likes: 42,
            comments: 12
        },
        {
            id: 3,
            name: '小李',
            avatar: '🏃‍♂️',
            content: '坚持跑步第30天，感觉身体状态越来越好！',
            time: '昨天',
            likes: 36,
            comments: 8
        }
    ];

    // 兴趣社群数据
    const communities = [
        {
            id: 1,
            name: '读书分享',
            icon: '📚',
            members: 1240,
            description: '分享读书心得，讨论书籍内容',
            posts: 320
        },
        {
            id: 2,
            name: '摄影爱好者',
            icon: '📷',
            members: 890,
            description: '分享摄影作品，交流拍摄技巧',
            posts: 256
        },
        {
            id: 3,
            name: '运动健身',
            icon: '💪',
            members: 1560,
            description: '分享健身经验，互相鼓励',
            posts: 412
        },
        {
            id: 4,
            name: '编程技术',
            icon: '💻',
            members: 2100,
            description: '讨论编程技术，解决技术问题',
            posts: 580
        }
    ];

    // 数字人社交数据
    const digitalHumans = [
        {
            id: 1,
            name: '小E',
            avatar: '🤖',
            personality: '活泼开朗',
            description: '喜欢聊天，擅长讲笑话',
            status: '在线'
        },
        {
            id: 2,
            name: '小A',
            avatar: '👩‍💼',
            personality: '专业理性',
            description: '知识渊博，善于分析问题',
            status: '在线'
        },
        {
            id: 3,
            name: '小M',
            avatar: '🎭',
            personality: '创意无限',
            description: '喜欢艺术，善于创作',
            status: '离线'
        }
    ];

    // 发布动态
    const handlePost = () => {
        if (postContent.trim()) {
            // 这里可以添加发布逻辑
            console.log('发布动态:', postContent);
            setPostContent('');
            setShowPostModal(false);
        }
    };

    return (
        <div className={`social-connection-container ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="content-header social-connection-header">
                <button className="content-back-btn social-connection-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="content-title social-connection-title">社交连接</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 内容区域 */}
            <div className="social-content">
                {/* 标签页切换 */}
                <div className="tab-container">
                    <button 
                        className={`tab-button ${selectedTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('friends')}
                    >
                        虚拟朋友圈
                    </button>
                    <button 
                        className={`tab-button ${selectedTab === 'communities' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('communities')}
                    >
                        兴趣社群
                    </button>
                    <button 
                        className={`tab-button ${selectedTab === 'digital' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('digital')}
                    >
                        数字人社交
                    </button>
                </div>

                {/* 虚拟朋友圈 */}
                {selectedTab === 'friends' && (
                    <div className="friends-section">
                        {/* 发布动态按钮 */}
                        <div className="post-create">
                            <button className="create-post-btn" onClick={() => setShowPostModal(true)}>
                                发布动态
                            </button>
                        </div>

                        {/* 动态列表 */}
                        <div className="posts-list">
                            {friendsPosts.map(post => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <div className="post-avatar">{post.avatar}</div>
                                        <div className="post-info">
                                            <h4>{post.name}</h4>
                                            <span className="post-time">{post.time}</span>
                                        </div>
                                    </div>
                                    <div className="post-content">
                                        <p>{post.content}</p>
                                    </div>
                                    <div className="post-actions">
                                        <button className="action-btn">
                                            ❤️ {post.likes}
                                        </button>
                                        <button className="action-btn">
                                            💬 {post.comments}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 兴趣社群 */}
                {selectedTab === 'communities' && (
                    <div className="communities-section">
                        <div className="communities-grid">
                            {communities.map(community => (
                                <div 
                                    key={community.id} 
                                    className={`community-card ${activeCommunity === community.id ? 'active' : ''}`}
                                    onClick={() => setActiveCommunity(community.id)}
                                >
                                    <div className="community-icon">{community.icon}</div>
                                    <h3>{community.name}</h3>
                                    <p className="community-description">{community.description}</p>
                                    <div className="community-stats">
                                        <span>👥 {community.members} 成员</span>
                                        <span>📝 {community.posts} 帖子</span>
                                    </div>
                                    <button className="join-community-btn">
                                        {activeCommunity === community.id ? '已加入' : '加入社群'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 数字人社交 */}
                {selectedTab === 'digital' && (
                    <div className="digital-section">
                        <div className="digital-humans-list">
                            {digitalHumans.map(dh => (
                                <div key={dh.id} className="digital-human-card">
                                    <div className="digital-avatar">{dh.avatar}</div>
                                    <h3>{dh.name}</h3>
                                    <p className="digital-personality">{dh.personality}</p>
                                    <p className="digital-description">{dh.description}</p>
                                    <div className={`digital-status ${dh.status === '在线' ? 'online' : 'offline'}`}>
                                        {dh.status}
                                    </div>
                                    <button className="chat-with-digital-btn">
                                        开始聊天
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 发布动态模态框 */}
            {showPostModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>发布动态</h3>
                            <button className="close-modal" onClick={() => setShowPostModal(false)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <textarea
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                placeholder="分享你的想法..."
                                rows={6}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowPostModal(false)}>
                                取消
                            </button>
                            <button 
                                className="submit-btn" 
                                onClick={handlePost}
                                disabled={!postContent.trim()}
                            >
                                发布
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialConnection;