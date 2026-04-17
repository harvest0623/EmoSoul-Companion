import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import momentApi from '../../services/momentService';
import useThemeStore from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import './Social.css';

// 引入图标字体
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '//at.alicdn.com/t/c/font_5158834_czcc22vhf94.css';
document.head.appendChild(link);

// 情绪标签映射
const EMOTION_LABELS = {
  happy: { label: '开心', emoji: '😊', color: '#FFD700' },
  sad: { label: '难过', emoji: '😢', color: '#64B5F6' },
  angry: { label: '生气', emoji: '😠', color: '#FF5252' },
  surprised: { label: '惊讶', emoji: '😲', color: '#FF9800' },
  anxious: { label: '焦虑', emoji: '😰', color: '#FFC107' },
  calm: { label: '平静', emoji: '😌', color: '#81C784' },
  thinking: { label: '思考', emoji: '🤔', color: '#CE93D8' },
  love: { label: '心动', emoji: '😍', color: '#F48FB1' }
};

const EMOTION_KEYS = Object.keys(EMOTION_LABELS);

// 时间格式化函数
const formatTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
};

/**
 * 动态广场页面
 */
const Social = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const [moments, setMoments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 发布弹窗状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({
    content: '',
    emotion: 'happy'
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // 评论区状态
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [comments, setComments] = useState({});
  const [isLoadingComments, setIsLoadingComments] = useState({});

  // 加载动态列表
  const loadMoments = useCallback(async (pageNum = 1, append = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await momentApi.getMoments(pageNum, 20);
      if (result.code === 200) {
        const responseData = result.data || {};
        const newMoments = responseData.list || [];
        if (append) {
          setMoments(prev => [...prev, ...newMoments]);
        } else {
          setMoments(newMoments);
        }
        // 使用 totalPages 判断是否还有更多数据
        const totalPages = responseData.totalPages || 1;
        const currentPage = responseData.page || 1;
        setHasMore(currentPage < totalPages);
      }
    } catch (error) {
      console.error('加载动态失败:', error);
      toast.error('加载动态失败');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // 初始加载
  useEffect(() => {
    loadMoments(1, false);
  }, []);

  // 发布动态
  const handlePublish = async () => {
    if (!publishForm.content.trim()) {
      toast.error('请输入内容');
      return;
    }

    setIsPublishing(true);
    try {
      const result = await momentApi.createMoment({
        content: publishForm.content.trim(),
        emotion: publishForm.emotion
      });
      if (result.code === 200) {
        toast.success('发布成功！');
        setShowPublishModal(false);
        setPublishForm({ content: '', emotion: 'happy' });
        // 刷新列表
        setPage(1);
        loadMoments(1, false);
      }
    } catch (error) {
      toast.error('发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

  // 删除动态
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条动态吗？')) return;
    try {
      const result = await momentApi.deleteMoment(id);
      if (result.code === 200) {
        toast.success('删除成功');
        setMoments(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 点赞/取消点赞
  const handleToggleLike = async (moment) => {
    try {
      const result = await momentApi.toggleLike(moment.id);
      if (result.code === 200) {
        setMoments(prev => prev.map(m => {
          if (m.id === moment.id) {
            return {
              ...m,
              likesCount: result.data.liked ? m.likesCount + 1 : m.likesCount - 1,
              isLiked: result.data.liked
            };
          }
          return m;
        }));
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 展开/收起评论区
  const toggleComments = async (momentId) => {
    const isExpanded = expandedComments[momentId];
    if (isExpanded) {
      setExpandedComments(prev => ({ ...prev, [momentId]: false }));
    } else {
      setExpandedComments(prev => ({ ...prev, [momentId]: true }));
      // 加载评论
      if (!comments[momentId]) {
        setIsLoadingComments(prev => ({ ...prev, [momentId]: true }));
        try {
          const result = await momentApi.getComments(momentId);
          if (result.code === 200) {
            setComments(prev => ({ ...prev, [momentId]: result.data || [] }));
          }
        } catch (error) {
          toast.error('加载评论失败');
        } finally {
          setIsLoadingComments(prev => ({ ...prev, [momentId]: false }));
        }
      }
    }
  };

  // 添加评论
  const handleAddComment = async (momentId) => {
    const content = commentInputs[momentId]?.trim();
    if (!content) {
      toast.error('请输入评论内容');
      return;
    }

    try {
      const result = await momentApi.addComment(momentId, content);
      if (result.code === 200) {
        toast.success('评论成功');
        setCommentInputs(prev => ({ ...prev, [momentId]: '' }));
        // 更新评论列表
        setComments(prev => ({
          ...prev,
          [momentId]: [result.data, ...(prev[momentId] || [])]
        }));
        // 更新评论数
        setMoments(prev => prev.map(m => {
          if (m.id === momentId) {
            return { ...m, commentsCount: (m.commentsCount || 0) + 1 };
          }
          return m;
        }));
      }
    } catch (error) {
      toast.error('评论失败');
    }
  };

  // 加载更多
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMoments(nextPage, true);
  };

  // 获取情绪配置
  const getEmotionConfig = (key) => EMOTION_LABELS[key] || EMOTION_LABELS.happy;

  // 判断是否是自己的动态
  const isOwnMoment = (moment) => {
    return user && moment.userId === user.id;
  };

  return (
    <div className={`social-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="social-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/home')}>
            <span className="iconfont icon-fanhui"></span>
          </button>
          <h1>动态广场</h1>
        </div>
        <div className="header-right">
          <button className="publish-btn" onClick={() => setShowPublishModal(true)}>
            <span className="iconfont icon-bianji"></span>
          </button>
          <button 
            className="mode-toggle-btn" 
            onClick={toggleDarkMode} 
            aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}
          >
            <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
          </button>
        </div>
      </header>

      {/* 动态列表 */}
      <div className="social-content">
        {moments.length === 0 && !isLoading ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>还没有动态，来发布第一条吧！</p>
          </div>
        ) : (
          <div className="moments-list">
            {moments.map(moment => {
              const emotionConfig = getEmotionConfig(moment.emotion);
              const isExpanded = expandedComments[moment.id];
              const momentComments = comments[moment.id] || [];
              const isLoadingComment = isLoadingComments[moment.id];

              return (
                <div key={moment.id} className="moment-card">
                  {/* 删除按钮 */}
                  {isOwnMoment(moment) && (
                    <button 
                      className="moment-delete-btn"
                      onClick={() => handleDelete(moment.id)}
                      title="删除"
                    >
                      <span className="iconfont icon-shanchu"></span>
                    </button>
                  )}

                  {/* 用户信息 */}
                  <div className="moment-header">
                    <div className="moment-avatar">
                      {moment.user?.avatar ? (
                        <img src={moment.user.avatar} alt={moment.user?.nickname} />
                      ) : (
                        <div className="avatar-placeholder">
                          {moment.user?.nickname?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="moment-meta">
                      <span className="moment-nickname">{moment.user?.nickname}</span>
                      <span className="moment-time">{formatTime(moment.createdAt)}</span>
                    </div>
                  </div>

                  {/* 情绪标签 */}
                  <div className="moment-emotion">
                    <span 
                      className="emotion-tag"
                      style={{ backgroundColor: `${emotionConfig.color}20`, color: emotionConfig.color }}
                    >
                      {emotionConfig.emoji} {emotionConfig.label}
                    </span>
                  </div>

                  {/* 内容 */}
                  <div className="moment-content">
                    {moment.content}
                  </div>

                  {/* 操作栏 */}
                  <div className="moment-actions">
                    <button
                      className={`action-btn like-btn ${moment.isLiked ? 'liked' : ''}`}
                      onClick={() => handleToggleLike(moment)}
                    >
                      <span className="action-icon">{moment.isLiked ? '❤️' : '🤍'}</span>
                      <span className="action-count">{moment.likesCount || 0}</span>
                    </button>
                    <button 
                      className={`action-btn comment-btn ${isExpanded ? 'active' : ''}`}
                      onClick={() => toggleComments(moment.id)}
                    >
                      <span className="action-icon">💬</span>
                      <span className="action-count">{moment.commentsCount || 0}</span>
                    </button>
                  </div>

                  {/* 评论区 */}
                  {isExpanded && (
                    <div className="moment-comments-section">
                      {isLoadingComment ? (
                        <div className="comments-loading">加载中...</div>
                      ) : (
                        <>
                          <div className="comments-list">
                            {momentComments.length === 0 ? (
                              <div className="no-comments">暂无评论，来说点什么吧~</div>
                            ) : (
                              momentComments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                  <div className="comment-avatar">
                                    {comment.user?.avatar ? (
                                      <img src={comment.user.avatar} alt={comment.user?.nickname} />
                                    ) : (
                                      <div className="avatar-placeholder small">
                                        {comment.user?.nickname?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="comment-body">
                                    <div className="comment-header">
                                      <span className="comment-nickname">{comment.user?.nickname}</span>
                                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                                    </div>
                                    <div className="comment-content">{comment.content}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="comment-input-area">
                            <input
                              type="text"
                              placeholder="写下你的评论..."
                              value={commentInputs[moment.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ 
                                ...prev, 
                                [moment.id]: e.target.value 
                              }))}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(moment.id)}
                            />
                            <button onClick={() => handleAddComment(moment.id)}>
                              发送
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && moments.length > 0 && (
          <div className="load-more">
            <button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>

      {/* 发布弹窗 */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="publish-modal" onClick={e => e.stopPropagation()}>
            <h3>发布动态</h3>
            
            <textarea
              className="publish-textarea"
              placeholder="分享你的心情..."
              value={publishForm.content}
              onChange={(e) => setPublishForm(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              maxLength={500}
            />
            <div className="content-count">
              {publishForm.content.length}/500
            </div>

            <div className="emotion-selector">
              <label>选择情绪：</label>
              <div className="emotion-options">
                {EMOTION_KEYS.map(key => {
                  const config = EMOTION_LABELS[key];
                  return (
                    <button
                      key={key}
                      className={`emotion-option ${publishForm.emotion === key ? 'active' : ''}`}
                      onClick={() => setPublishForm(prev => ({ ...prev, emotion: key }))}
                      style={publishForm.emotion === key ? { 
                        borderColor: config.color, 
                        backgroundColor: `${config.color}15` 
                      } : {}}
                    >
                      <span className="emotion-emoji">{config.emoji}</span>
                      <span className="emotion-label">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
              >
                取消
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handlePublish}
                disabled={isPublishing || !publishForm.content.trim()}
              >
                {isPublishing ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
