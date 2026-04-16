import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DigitalAvatar from '../../components/DigitalAvatar';
import ChatMessage from '../../components/ChatMessage';
import { chatApi } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';
import useThemeStore from '../../store/themeStore';
import { COMPANION_STATUSES, getCompanionStatusById } from '../../constants/companionStatus';
import './chat.css';

// 引入图标字体
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '//at.alicdn.com/t/c/font_5158834_czcc22vhf94.css';
document.head.appendChild(link);

/**
 * 聊天页面 - 数字人对话页面
 */
const Chat = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const {
    messages,
    currentEmotion,
    isLoading,
    lastMessageId,
    chatMode,
    addMessage,
    setMessages,
    setEmotion,
    setLoading,
    setChatMode,
    updateMessageResponse,
    companionStatus,
    setCompanionStatus
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusPickerRef = useRef(null);

  // 从全局主题状态获取
  const { darkMode, toggleDarkMode } = useThemeStore();

  const currentCompanion = getCompanionStatusById(companionStatus);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!statusMenuOpen) return;
      if (statusPickerRef.current && !statusPickerRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [statusMenuOpen]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载历史对话
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await chatApi.getHistory({ limit: 50 });
        if (result.code === 200) {
          const historyMessages = result.data.map(item => ({
            id: item.id,
            text: item.message,
            response: item.response,
            emotion: item.emotion,
            isUser: true,
            hasResponse: !!item.response,
            timestamp: item.created_at
          }));
          setMessages(historyMessages.reverse());
        }
      } catch (error) {
        console.error('加载历史记录失败:', error);
      }
    };

    loadHistory();
  }, [setMessages]);

  // 轮询获取新消息
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const result = await chatApi.pollMessages(lastMessageId);
        if (result.code === 200 && result.data.hasNew) {
          const newMessage = result.data.message;
          updateMessageResponse(
            newMessage.id,
            newMessage.response,
            newMessage.emotion
          );
          setEmotion(newMessage.emotion);
        }
      } catch (error) {
        console.error('轮询消息失败:', error);
      }
    };

    // 每5秒轮询一次
    pollIntervalRef.current = setInterval(pollMessages, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [lastMessageId, setEmotion, updateMessageResponse]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);
    setLoading(true);

    // 添加用户消息
    const tempId = Date.now();
    addMessage({
      id: tempId,
      text: messageText,
      isUser: true,
      hasResponse: false,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await chatApi.sendMessage(messageText, chatMode);
      if (result.code === 200) {
        // 更新消息，添加AI回复
        updateMessageResponse(
          tempId,
          result.data.response,
          result.data.emotion
        );
        setEmotion(result.data.emotion);
        setIsTyping(false);
      }
    } catch (error) {
      toast.error('发送失败，请重试');
      setIsTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('确定要清空所有对话记录吗？')) return;

    try {
      await chatApi.clearHistory();
      setMessages([]);
      toast.success('对话记录已清空');
    } catch (error) {
      toast.error('清空失败');
    }
  };

  return (
    <div className={`home-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="home-header">
        <div className="header-brand">
          <h1>语你相伴</h1>
        </div>
        <nav className="header-nav">
          <button className="nav-btn" onClick={() => navigate('/home')}>首页</button>
          <button className="nav-btn active">对话</button>
          <button className="nav-btn" onClick={() => navigate('/profile')}>
            我的
          </button>
          <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
            <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
          </button>
        </nav>
      </header>

      <div className="home-content">
        {/* 左侧 - 数字人展示区 */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <DigitalAvatar
              emotion={currentEmotion}
              isTyping={isTyping}
            />
          </div>
          <div className="avatar-status">
            <span className={`status-dot ${isTyping ? 'typing' : 'online'}`}></span>
            <span className="status-text">
              {isTyping ? '正在输入...' : '在线陪伴中'}
            </span>
          </div>
          <div className="emotion-tags" ref={statusPickerRef}>
            <button
              type="button"
              className={`emotion-tag emotion-tag-pickable ${companionStatus}`}
              onClick={() => setStatusMenuOpen((o) => !o)}
              aria-expanded={statusMenuOpen}
              aria-haspopup="listbox"
              aria-label="选择我的状态"
            >
              <span>
                {currentCompanion.emoji} {currentCompanion.label}
              </span>
              <span className="emotion-tag-chevron" aria-hidden>
                ▾
              </span>
            </button>
            {statusMenuOpen && (
              <div className="status-picker" role="listbox" aria-label="状态列表">
                <p className="status-picker-title">换个状态</p>
                <div className="status-picker-grid">
                  {COMPANION_STATUSES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={companionStatus === s.id}
                      className={`status-picker-item ${companionStatus === s.id ? 'selected' : ''}`}
                      onClick={() => {
                        setCompanionStatus(s.id);
                        setStatusMenuOpen(false);
                      }}
                    >
                      <span className="status-picker-emoji">{s.emoji}</span>
                      <span className="status-picker-label">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 对话区 */}
        <div className="chat-section">
          <div className="chat-header">
            <h3>对话记录</h3>
            <button className="clear-btn" onClick={handleClearHistory}>
              清空记录
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>开始和AI伙伴对话吧</p>
                <span>分享你的想法和感受</span>
              </div>
            ) : (
              messages.map((msg) => (
                <React.Fragment key={msg.id}>
                  <ChatMessage
                    message={msg.text}
                    isUser={true}
                  />
                  {msg.hasResponse && (
                    <ChatMessage
                      message={msg.response}
                      isUser={false}
                      emotion={msg.emotion || 'gentle'}
                    />
                  )}
                </React.Fragment>
              ))
            )}
            {isTyping && (
              <ChatMessage
                message=""
                isUser={false}
                emotion={currentEmotion}
                isTyping={true}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="mode-toggle">
              <button
                className={`mode-btn ${chatMode === 'normal' ? 'active' : ''}`}
                onClick={() => setChatMode('normal')}
              >
                普通模式
              </button>
              <button
                className={`mode-btn vip ${chatMode === 'vip' ? 'active' : ''}`}
                onClick={() => setChatMode('vip')}
              >
                <span className="vip-crown">👑</span> VIP模式
              </button>
            </div>
            <div className="input-wrapper">
              <textarea
                className="chat-input"
                placeholder="输入你想说的话..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                disabled={isLoading}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!inputMessage.trim() || isLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            <p className="input-hint">按 Enter 发送，Shift + Enter 换行</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;