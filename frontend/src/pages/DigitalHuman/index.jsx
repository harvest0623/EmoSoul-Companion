import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Live2DAvatar from '../../components/Live2DAvatar';
import { useCamera } from '../../hooks/useCamera';
import { chatApi } from '../../services/chatService';
import { emotionAnalysisApi } from '../../services/emotionAnalysisService';
import './DigitalHuman.css';

/**
 * 表情按钮配置
 */
const EXPRESSION_BUTTONS = [
  { key: 'happy', label: '开心', emoji: '😊' },
  { key: 'sad', label: '悲伤', emoji: '😢' },
  { key: 'surprised', label: '惊讶', emoji: '😮' },
  { key: 'calm', label: '放松', emoji: '😌' },
  { key: 'angry', label: '生气', emoji: '😠' },
  { key: 'calm', label: '中性', emoji: '😐' },
];

/**
 * 预设姿势
 */
const PRESET_POSES = [
  { key: 'greeting', label: '打招呼', group: 'TapBody', index: 0 },
  { key: 'idle1', label: '待机1', group: 'Idle', index: 0 },
  { key: 'idle2', label: '待机2', group: 'Idle', index: 1 },
  { key: 'idle3', label: '活泼待机', group: 'Idle', index: 2 },
  { key: 'tap1', label: '点击反应1', group: 'TapBody', index: 1 },
  { key: 'tap2', label: '点击反应2', group: 'TapBody', index: 2 },
];

/**
 * 数字人页面 - 多模态AI数字人测试平台
 */
const DigitalHuman = () => {
  const navigate = useNavigate();
  const {
    isEnabled: cameraEnabled,
    latestFrame,
    error: cameraError,
    startCamera,
    stopCamera,
    videoRef,
    canvasRef,
  } = useCamera(3000);

  // Live2D 状态
  const [currentEmotion, setCurrentEmotion] = useState('calm');
  const [avatarStatus, setAvatarStatus] = useState('IDLE');
  const [avatarEnabled, setAvatarEnabled] = useState(true);

  // 表情控制
  const [activeExpression, setActiveExpression] = useState('中性');

  // 姿势调试
  const [selectedPose, setSelectedPose] = useState('greeting');

  // 服务状态
  const [serviceStatus, setServiceStatus] = useState('unknown'); // unknown, ready, local, error
  const [emotionServiceStarted, setEmotionServiceStarted] = useState(false);
  const [asrEnabled, setAsrEnabled] = useState(false);

  // 三模情绪
  const [videoEmotion, setVideoEmotion] = useState(null);
  const [fusedEmotion, setFusedEmotion] = useState(null);

  // LLM 对话
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [llmOutput, setLlmOutput] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [dataStreamLog, setDataStreamLog] = useState([]);
  const chatEndRef = useRef(null);

  // 监测状态
  const [isMonitoring, setIsMonitoring] = useState(false);
  const pollTimerRef = useRef(null);

  // 检查服务状态
  useEffect(() => {
    const check = async () => {
      try {
        const res = await emotionAnalysisApi.checkHealth();
        if (res && res.code === 200 && res.data?.status === 'ok') {
          setServiceStatus('ready');
        } else {
          setServiceStatus('unknown');
        }
      } catch {
        setServiceStatus('unknown');
      }
    };
    check();
  }, []);

  // 表情按钮点击
  const handleExpressionClick = useCallback((btn) => {
    setCurrentEmotion(btn.key);
    setActiveExpression(btn.label);
    setAvatarStatus(btn.label.toUpperCase());
    toast.success(`切换表情: ${btn.emoji} ${btn.label}`, { duration: 1500 });
  }, []);

  // 应用预设姿势
  const handleApplyPose = useCallback(() => {
    const pose = PRESET_POSES.find(p => p.key === selectedPose);
    if (pose) {
      toast.success(`应用姿势: ${pose.label}`, { duration: 1500 });
    }
  }, [selectedPose]);

  // 启动/停止摄像头监测
  const handleToggleMonitoring = useCallback(async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      stopCamera();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      toast('已停止监测', { icon: '⏹️' });
    } else {
      if (!cameraEnabled) {
        await startCamera();
      }
      setIsMonitoring(true);
      toast.success('开始监测');
    }
  }, [isMonitoring, cameraEnabled, startCamera, stopCamera]);

  // 监测时定时分析
  useEffect(() => {
    if (isMonitoring && latestFrame) {
      const analyze = async () => {
        try {
          const res = await emotionAnalysisApi.analyzeFrame({ image: latestFrame });
          if (res.code === 200 && res.data) {
            const data = res.data;
            if (data.video_emotion) {
              setVideoEmotion({
                emotion: data.video_emotion,
                confidence: data.video_confidence || 0,
              });
            }
            if (data.fused_emotion) {
              setFusedEmotion({
                emotion: data.fused_emotion,
                confidence: data.fused_confidence || 0,
              });
              // 联动 Live2D 表情
              const emotionMap = {
                neutral: 'calm', happy: 'happy', sad: 'sad',
                surprise: 'surprised', fear: 'anxious', angry: 'angry',
              };
              const mappedEmotion = emotionMap[data.fused_emotion] || 'calm';
              setCurrentEmotion(mappedEmotion);
              setAvatarStatus(mappedEmotion.toUpperCase());
            }
          }
        } catch (err) {
          console.error('情绪分析失败:', err);
        }
      };

      analyze();
      pollTimerRef.current = setInterval(analyze, 3000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isMonitoring, latestFrame]);

  // 发送聊天消息
  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isSending) return;

    const message = userInput.trim();
    setUserInput('');
    setIsSending(true);
    setAvatarStatus('THINKING');

    // 添加用户消息到历史
    const userMsg = { role: 'user', content: message, time: new Date().toLocaleTimeString() };
    setConversationHistory(prev => [...prev, userMsg]);

    try {
      const facialImage = isMonitoring && latestFrame ? latestFrame : undefined;
      const res = await chatApi.sendMessage(message, facialImage, 'normal');

      if (res.data) {
        const reply = res.data.reply || res.data.message || '...';
        const expression = res.data.expression || 'calm';

        // 添加AI回复到历史
        const aiMsg = { role: 'assistant', content: reply, time: new Date().toLocaleTimeString() };
        setConversationHistory(prev => [...prev, aiMsg]);

        // 联动 Live2D 表情
        setCurrentEmotion(expression);
        setAvatarStatus(expression.toUpperCase());
        setActiveExpression(expression);

        // 设置 LLM 输出
        setLlmOutput({
          success: true,
          reply,
          expression,
          lipSync: res.data.lipSync || null,
        });

        // 添加数据流日志
        setDataStreamLog(prev => [...prev.slice(-19), {
          timestamp: new Date().toISOString(),
          input: { message, facialImage: !!facialImage },
          output: { reply, expression },
        }]);
      }
    } catch (err) {
      const errorMsg = '抱歉，回复出现问题，请稍后再试。';
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg, time: new Date().toLocaleTimeString() }]);
      setLlmOutput({ success: false, reply: '', expression: '', lipSync: null });
    } finally {
      setIsSending(false);
      setAvatarStatus('IDLE');
    }
  }, [userInput, isSending, isMonitoring, latestFrame]);

  // 按回车发送
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 滚动到底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  // 导出日志
  const handleExportLog = useCallback(() => {
    const blob = new Blob([JSON.stringify(dataStreamLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-human-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('日志已导出');
  }, [dataStreamLog]);

  return (
    <div className="dh-page">
      {/* 顶部导航栏 */}
      <header className="dh-header">
        <button className="dh-back-btn" onClick={() => navigate('/home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="dh-title">🤖 多模态AI数字人测试平台</h1>
        <div className="dh-header-actions">
          <span className={`dh-connection-badge ${serviceStatus === 'ready' ? 'connected' : serviceStatus === 'local' ? 'local' : ''}`}>
            {serviceStatus === 'ready' ? '服务已就绪' : serviceStatus === 'local' ? '本地模式' : '未连接'}
          </span>
        </div>
      </header>

      {/* 主体内容 - 三栏布局 */}
      <div className="dh-content">
        {/* ========== 左侧边栏 ========== */}
        <div className="dh-left-panel">
          {/* 收集器状态 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>📡 收集器</h3>
            </div>
            <div className="dh-service-status-list">
              <div className="dh-service-item">
                <span className="dh-service-name">Python 情绪识别服务</span>
                <span className={`dh-service-badge ${serviceStatus === 'ready' ? 'online' : 'offline'}`}>
                  {serviceStatus === 'ready' ? '已启动' : '未启动'}
                </span>
              </div>
              <div className="dh-service-item">
                <span className="dh-service-name">服务状态</span>
                <span className={`dh-service-badge ${serviceStatus === 'ready' ? 'online' : 'offline'}`}>
                  {serviceStatus === 'ready' ? '已就绪' : '未就绪'}
                </span>
              </div>
            </div>
          </div>

          {/* 摄像头视频流 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>📹 摄像头视频流</h3>
              <span className={`dh-connection-badge ${cameraEnabled ? 'connected' : ''}`}>
                {cameraEnabled ? '已启用' : '未启用'}
              </span>
            </div>
            <div className="dh-video-container">
              <video ref={videoRef} className="dh-video" autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {isMonitoring && videoEmotion && (
                <div className="dh-video-overlay">
                  <div className="dh-detection-box">
                    <span className="dh-detection-label">
                      {videoEmotion.emotion} {videoEmotion.confidence ? `${(videoEmotion.confidence * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                </div>
              )}

              {!cameraEnabled && (
                <div className="dh-video-placeholder">
                  <div className="dh-placeholder-icon">📷</div>
                  <p>点击下方按钮启动摄像头</p>
                </div>
              )}
            </div>

            <div className="dh-controls">
              <button
                className={`dh-btn ${isMonitoring ? 'dh-btn-active' : 'dh-btn-primary'}`}
                onClick={handleToggleMonitoring}
              >
                {isMonitoring ? '⏹ 停止监测' : '▶ 开始监测'}
              </button>
            </div>

            {cameraError && (
              <div className="dh-error-tip">⚠️ 摄像头错误: {cameraError}</div>
            )}
          </div>

          {/* ASR 语音识别 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>🎤 ASR 语音识别</h3>
              <span className={`dh-service-badge ${asrEnabled ? 'online' : 'offline'}`}>
                {asrEnabled ? '已启动' : '未启动'}
              </span>
            </div>
            <div className="dh-asr-placeholder">
              <span>语音识别功能开发中...</span>
            </div>
          </div>

          {/* 三模情绪 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>🎭 三模情绪</h3>
            </div>
            <div className="dh-fusion-result">
              <div className="dh-fusion-label">
                融合结果: {fusedEmotion ? `${fusedEmotion.emotion} ${(fusedEmotion.confidence * 100).toFixed(1)}%` : '等待检测...'}
              </div>
            </div>
          </div>

          {/* 表情控制 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>😊 表情控制</h3>
            </div>
            <div className="dh-expression-row">
              {EXPRESSION_BUTTONS.map(btn => (
                <button
                  key={btn.label}
                  className={`dh-expr-btn ${activeExpression === btn.label ? 'active' : ''}`}
                  onClick={() => handleExpressionClick(btn)}
                >
                  {btn.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 姿势调试 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>🦴 姿势调试</h3>
            </div>
            <div className="dh-pose-section">
              <div className="dh-pose-row">
                <label>预设姿势:</label>
                <select value={selectedPose} onChange={e => setSelectedPose(e.target.value)}>
                  {PRESET_POSES.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <button className="dh-btn dh-btn-sm" onClick={handleApplyPose}>应用</button>
              </div>
              <button
                className="dh-btn dh-btn-outline"
                onClick={() => {
                  setCurrentEmotion('calm');
                  setActiveExpression('中性');
                  setAvatarStatus('IDLE');
                  toast('已重置表情', { icon: '🔄' });
                }}
              >
                🔄 恢复默认动画
              </button>
            </div>
          </div>
        </div>

        {/* ========== 中间 - 数字人展示 ========== */}
        <div className="dh-center-panel">
          <div className="dh-panel-card dh-avatar-card">
            <div className="dh-panel-header">
              <h3>🪄 Live2D 数字人</h3>
              <span className={`dh-connection-badge ${avatarEnabled ? 'connected' : ''}`}>
                {avatarEnabled ? '已启用' : '已禁用'}
              </span>
            </div>

            <div className="dh-avatar-display">
              <Live2DAvatar
                emotion={currentEmotion}
                isTyping={isSending}
                onError={(err) => {
                  console.error('Live2D 加载失败:', err);
                  setAvatarEnabled(false);
                }}
              />
            </div>

            <div className="dh-avatar-status">
              当前状态：{avatarStatus}
            </div>

            <div className="dh-avatar-toolbar">
              <button
                className="dh-toolbar-btn"
                onClick={() => handleExpressionClick(EXPRESSION_BUTTONS[0])}
                title="开心"
              >😊</button>
              <button
                className="dh-toolbar-btn"
                onClick={() => {
                  setAvatarEnabled(prev => !prev);
                  toast(avatarEnabled ? '数字人已禁用' : '数字人已启用', { icon: avatarEnabled ? '⏸️' : '▶️' });
                }}
                title="开关数字人"
              >👤</button>
              <button
                className="dh-toolbar-btn"
                onClick={() => handleExpressionClick(EXPRESSION_BUTTONS[2])}
                title="惊讶"
              >😮</button>
              <button
                className="dh-toolbar-btn"
                onClick={() => {
                  setCurrentEmotion('calm');
                  setActiveExpression('中性');
                  setAvatarStatus('IDLE');
                }}
                title="重置"
              >🔄</button>
            </div>
          </div>
        </div>

        {/* ========== 右侧边栏 ========== */}
        <div className="dh-right-panel">
          {/* 思考层 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>💭 思考层</h3>
              <span className="dh-mode-toggle">简洁模式</span>
            </div>
          </div>

          {/* 用户输入 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>✍️ 用户输入</h3>
            </div>
            <div className="dh-input-area">
              <textarea
                className="dh-input-textarea"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入文字与AI对话，或点击麦克风使用语音..."
                rows={3}
                disabled={isSending}
              />
              <div className="dh-input-actions">
                <button className="dh-btn dh-btn-icon" title="语音输入" disabled>
                  🎤
                </button>
                <button
                  className="dh-btn dh-btn-primary dh-btn-send"
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isSending}
                >
                  {isSending ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>

          {/* LLM 输出 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>📤 LLM 输出</h3>
            </div>
            <div className="dh-llm-output">
              {llmOutput ? (
                <pre className="dh-json-block">{JSON.stringify(llmOutput, null, 2)}</pre>
              ) : (
                <div className="dh-empty-state">等待 LLM 响应...</div>
              )}
            </div>
          </div>

          {/* 对话历史 */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>💬 对话历史</h3>
            </div>
            <div className="dh-chat-history">
              {conversationHistory.length === 0 ? (
                <div className="dh-empty-state">暂无对话记录</div>
              ) : (
                conversationHistory.map((msg, idx) => (
                  <div key={idx} className={`dh-chat-msg ${msg.role}`}>
                    <span className="dh-chat-role">{msg.role === 'user' ? '👤' : '🤖'}</span>
                    <div className="dh-chat-bubble">
                      <span className="dh-chat-text">{msg.content}</span>
                      <span className="dh-chat-time">{msg.time}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* 完整数据流 JSON */}
          <div className="dh-panel-card">
            <div className="dh-panel-header">
              <h3>📊 完整数据流 JSON</h3>
              <button className="dh-btn dh-btn-sm dh-btn-outline" onClick={handleExportLog} disabled={dataStreamLog.length === 0}>
                📥 导出日志
              </button>
            </div>
            <div className="dh-data-stream">
              {dataStreamLog.length === 0 ? (
                <div className="dh-empty-state">[]</div>
              ) : (
                <pre className="dh-json-block dh-json-compact">{JSON.stringify(dataStreamLog, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalHuman;
