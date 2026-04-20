import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Live2DAvatar from '../../components/Live2DAvatar';
import { useCamera } from '../../hooks/useCamera';
import { chatApi } from '../../services/chatService';
import { emotionAnalysisApi } from '../../services/emotionAnalysisService';
import './DigitalHuman.css';

const EXPRESSION_BUTTONS = [
    { key: 'happy', label: '开心', emoji: '😊' },
    { key: 'sad', label: '悲伤', emoji: '😢' },
    { key: 'surprised', label: '惊讶', emoji: '😮' },
    { key: 'calm', label: '放松', emoji: '😌' },
    { key: 'angry', label: '生气', emoji: '😠' },
    { key: 'calm', label: '中性', emoji: '😐' },
];

const PRESET_POSES = [
    { key: 'greeting', label: '打招呼', group: 'TapBody', index: 0 },
    { key: 'idle1', label: '待机1', group: 'Idle', index: 0 },
    { key: 'idle2', label: '待机2', group: 'Idle', index: 1 },
    { key: 'idle3', label: '活泼待机', group: 'Idle', index: 2 },
    { key: 'tap1', label: '点击反应1', group: 'TapBody', index: 1 },
    { key: 'tap2', label: '点击反应2', group: 'TapBody', index: 2 },
];

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

    const [currentEmotion, setCurrentEmotion] = useState('calm');
    const [avatarStatus, setAvatarStatus] = useState('IDLE');
    const [avatarEnabled, setAvatarEnabled] = useState(true);

    const [activeExpression, setActiveExpression] = useState('中性');

    const [selectedPose, setSelectedPose] = useState('greeting');

    const [serviceStatus, setServiceStatus] = useState('checking');
    const [useLocalMode, setUseLocalMode] = useState(false);
    const [loadingTime, setLoadingTime] = useState(0);
    const [emotionServiceStarted, setEmotionServiceStarted] = useState(false);
    const [asrEnabled, setAsrEnabled] = useState(false);
    const loadingTimerRef = useRef(null);

    const [videoEmotion, setVideoEmotion] = useState(null);
    const [fusedEmotion, setFusedEmotion] = useState(null);

    const [userInput, setUserInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [llmOutput, setLlmOutput] = useState(null);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [dataStreamLog, setDataStreamLog] = useState([]);
    const chatEndRef = useRef(null);

    const [isMonitoring, setIsMonitoring] = useState(false);
    const pollTimerRef = useRef(null);

    const checkServiceStatus = useCallback(async () => {
        try {
            const res = await emotionAnalysisApi.checkHealth();
            if (res && res.code === 200 && res.data?.status === 'ok') {
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setServiceStatus('checking');
            const ready = await checkServiceStatus();
            if (ready) {
                setServiceStatus('ready');
                setUseLocalMode(false);
            } else {
                setServiceStatus('unknown');
            }
        };
        init();

        return () => {
            if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, [checkServiceStatus]);

    const startInferenceService = useCallback(async () => {
        setServiceStatus('loading');
        setLoadingTime(0);

        loadingTimerRef.current = setInterval(() => {
            setLoadingTime(prev => prev + 1);
        }, 1000);

        try {
            await emotionAnalysisApi.startService();
            const maxRetries = 60;
            for (let i = 0; i < maxRetries; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const ready = await checkServiceStatus();
                if (ready) {
                    clearInterval(loadingTimerRef.current);
                    setServiceStatus('ready');
                    setUseLocalMode(false);
                    toast.success('情绪识别服务已就绪');
                    return;
                }
            }
            clearInterval(loadingTimerRef.current);
            setServiceStatus('error');
            toast.error('服务启动超时，请检查 Python 环境');
        } catch {
            clearInterval(loadingTimerRef.current);
            setServiceStatus('error');
            toast.error('服务启动失败，请使用本地模拟模式');
        }
    }, [checkServiceStatus]);

    const useLocalModeHandler = useCallback(() => {
        setServiceStatus('local');
        setUseLocalMode(true);
        toast.success('已切换到本地模拟模式', { icon: '🖥️' });
    }, []);

    const handleExpressionClick = useCallback((btn) => {
        setCurrentEmotion(btn.key);
        setActiveExpression(btn.label);
        setAvatarStatus(btn.label.toUpperCase());
        toast.success(`切换表情: ${btn.emoji} ${btn.label}`, { duration: 1500 });
    }, []);

    const handleApplyPose = useCallback(() => {
        const pose = PRESET_POSES.find(p => p.key === selectedPose);
        if (pose) {
            toast.success(`应用姿势: ${pose.label}`, { duration: 1500 });
        }
    }, [selectedPose]);

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

    const analyzeFrame = useCallback(async () => {
        if (!latestFrame) return;
        try {
            const res = await emotionAnalysisApi.analyzeFrame({ image: latestFrame });
            if (res.code === 200 && res.data) {
                const data = res.data;
                if (data.video_emotion) {
                    setVideoEmotion({ emotion: data.video_emotion, confidence: data.video_confidence || 0 });
                }
                if (data.fused_emotion) {
                    setFusedEmotion({ emotion: data.fused_emotion, confidence: data.fused_confidence || 0 });
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
    }, [latestFrame]);

    const localAnalyzeFrame = useCallback(() => {
        if (!latestFrame) return;
        const emotions = ['neutral', 'happy', 'sad', 'surprise', 'fear', 'angry'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const confidence = parseFloat((Math.random() * 0.4 + 0.3).toFixed(4));

        setVideoEmotion({ emotion: randomEmotion, confidence });
        setFusedEmotion({ emotion: randomEmotion, confidence });

        const emotionMap = {
            neutral: 'calm', happy: 'happy', sad: 'sad',
            surprise: 'surprised', fear: 'anxious', angry: 'angry',
        };
        const mappedEmotion = emotionMap[randomEmotion] || 'calm';
        setCurrentEmotion(mappedEmotion);
        setAvatarStatus(mappedEmotion.toUpperCase());
    }, [latestFrame]);

    useEffect(() => {
        if (isMonitoring && latestFrame) {
            if (useLocalMode) {
                localAnalyzeFrame();
            } else {
                analyzeFrame();
            }
            pollTimerRef.current = setInterval(() => {
                if (useLocalMode) {
                    localAnalyzeFrame();
                } else {
                    analyzeFrame();
                }
            }, 3000);
        }

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [isMonitoring, latestFrame, useLocalMode, analyzeFrame, localAnalyzeFrame]);

    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || isSending) return;

        const message = userInput.trim();
        setUserInput('');
        setIsSending(true);
        setAvatarStatus('THINKING');

        const userMsg = { role: 'user', content: message, time: new Date().toLocaleTimeString() };
        setConversationHistory(prev => [...prev, userMsg]);

        try {
            const facialImage = isMonitoring && latestFrame ? latestFrame : undefined;
            const res = await chatApi.sendMessage(message, facialImage, 'normal');

            if (res.data && res.data.data) {
                const reply = res.data.data.response || res.data.data.reply || res.data.data.message || '...';
                const expression = res.data.data.emotion || res.data.data.expression || 'calm';

                const aiMsg = { role: 'assistant', content: reply, time: new Date().toLocaleTimeString() };
                setConversationHistory(prev => [...prev, aiMsg]);

                setCurrentEmotion(expression);
                setAvatarStatus(expression.toUpperCase());
                setActiveExpression(expression);

                setLlmOutput({
                    success: true,
                    reply,
                    expression,
                    lipSync: null,
                });

                setDataStreamLog(prev => [...prev.slice(-19), {
                    timestamp: new Date().toISOString(),
                    input: { message, facialImage: !!facialImage },
                    output: { reply, expression },
                }]);
            } else if (res.data) {
                const reply = res.data.reply || res.data.message || '...';
                const expression = res.data.expression || 'calm';

                const aiMsg = { role: 'assistant', content: reply, time: new Date().toLocaleTimeString() };
                setConversationHistory(prev => [...prev, aiMsg]);

                setCurrentEmotion(expression);
                setAvatarStatus(expression.toUpperCase());
                setActiveExpression(expression);

                setLlmOutput({
                    success: true,
                    reply,
                    expression,
                    lipSync: null,
                });
            }
        } catch (err) {
            console.error('聊天请求失败:', err);
            const errorMsg = '抱歉，回复出现问题，请稍后再试。';
            setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg, time: new Date().toLocaleTimeString() }]);
            setLlmOutput({ success: false, reply: '', expression: '', lipSync: null });
        } finally {
            setIsSending(false);
            setAvatarStatus('IDLE');
        }
    }, [userInput, isSending, isMonitoring, latestFrame]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversationHistory]);

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
            <header className="dh-header">
                <button className="dh-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="dh-title">🤖 多模态AI数字人测试平台</h1>
                <div className="dh-header-actions">
                    <span className={`dh-connection-badge ${serviceStatus === 'ready' ? 'connected' : serviceStatus === 'local' ? 'local' : ''}`}>
                        {serviceStatus === 'ready' ? '服务已就绪' : serviceStatus === 'local' ? '本地模式' : serviceStatus === 'loading' ? '加载中...' : serviceStatus === 'checking' ? '检测中...' : '未连接'}
                    </span>
                </div>
            </header>

            {(serviceStatus === 'unknown' || serviceStatus === 'error') && (
                <div className="dh-modal-overlay">
                    <div className="dh-modal-dialog">
                        <div className="dh-modal-icon-header">🤖</div>
                        <h3>情绪识别服务</h3>
                        <p>首次使用需启动 Python 推理服务（加载 DeepFace 模型约需 20~40 秒）</p>
                        <p className="dh-modal-hint">
                            如果后端服务不可用，也可以使用本地模拟模式进行体验
                        </p>
                        {serviceStatus === 'error' && (
                            <div className="dh-modal-error">
                                服务启动失败，建议使用本地模拟模式
                            </div>
                        )}
                        <div className="dh-modal-actions">
                            <button className="dh-btn dh-btn-primary" onClick={startInferenceService}>
                                ▶ 自动启动服务
                            </button>
                            <button className="dh-btn dh-btn-secondary" onClick={useLocalModeHandler}>
                                🖥 使用本地模拟
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {serviceStatus === 'loading' && (
                <div className="dh-modal-overlay">
                    <div className="dh-modal-dialog">
                        <div className="dh-modal-icon-header loading">⏳</div>
                        <h3>正在加载模型...</h3>
                        <p>正在启动 Python 推理服务，请耐心等待</p>
                        <div className="dh-loading-progress">
                            <div className="dh-loading-bar">
                                <div
                                    className="dh-loading-fill"
                                    style={{ width: `${Math.min(100, (loadingTime / 40) * 100)}%` }}
                                />
                            </div>
                            <span className="dh-loading-time">已等待 {loadingTime}s</span>
                        </div>
                        <button className="dh-btn dh-btn-secondary dh-cancel-btn" onClick={useLocalModeHandler}>
                            取消，使用本地模拟
                        </button>
                    </div>
                </div>
            )}

            <div className="dh-content">
                <div className="dh-left-panel">
                    <div className="dh-panel-card">
                        <div className="dh-panel-header">
                            <h3>📡 收集器</h3>
                        </div>
                        <div className="dh-service-status-list">
                            <div className="dh-service-item">
                                <span className="dh-service-name">Python 情绪识别服务</span>
                                <span className={`dh-service-badge ${serviceStatus === 'ready' ? 'online' : serviceStatus === 'local' ? 'online' : 'offline'}`}>
                                    {serviceStatus === 'ready' ? '已启动' : serviceStatus === 'local' ? '本地模式' : '未启动'}
                                </span>
                            </div>
                            <div className="dh-service-item">
                                <span className="dh-service-name">服务状态</span>
                                <span className={`dh-service-badge ${serviceStatus === 'ready' ? 'online' : serviceStatus === 'local' ? 'online' : 'offline'}`}>
                                    {serviceStatus === 'ready' ? '已就绪' : serviceStatus === 'local' ? '已就绪' : '未就绪'}
                                </span>
                            </div>
                        </div>
                    </div>

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
                        </div>
                    </div>
                </div>

                <div className="dh-center-panel">
                    <div className="dh-panel-card dh-avatar-card">
                        <div className="dh-avatar-display">
                            <Live2DAvatar
                                emotion={currentEmotion}
                                avatarStatus={avatarStatus}
                                enabled={avatarEnabled}
                                width={320}
                                height={420}
                            />
                        </div>
                        <div className="dh-avatar-status">
                            状态: {avatarStatus}
                        </div>
                        <div className="dh-avatar-toolbar">
                            <button className="dh-toolbar-btn" onClick={() => setAvatarEnabled(!avatarEnabled)} title={avatarEnabled ? '隐藏形象' : '显示形象'}>
                                {avatarEnabled ? '👤' : '👁️'}
                            </button>
                            <button className="dh-toolbar-btn" onClick={handleExportLog} title="导出日志">
                                📥
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dh-right-panel">
                    <div className="dh-panel-card">
                        <div className="dh-panel-header">
                            <h3>💬 AI 对话</h3>
                            <span className="dh-mode-toggle">Normal</span>
                        </div>
                        <div className="dh-chat-history">
                            {conversationHistory.length === 0 ? (
                                <div className="dh-empty-state">
                                    开始和 AI 对话吧...
                                </div>
                            ) : (
                                conversationHistory.map((msg, index) => (
                                    <div key={index} className={`dh-chat-msg ${msg.role}`}>
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
                        <div className="dh-input-area">
                            <textarea
                                className="dh-input-textarea"
                                placeholder="输入消息..."
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={3}
                                disabled={isSending}
                            />
                            <div className="dh-input-actions">
                                <button
                                    className="dh-btn dh-btn-primary dh-btn-send"
                                    onClick={handleSendMessage}
                                    disabled={isSending || !userInput.trim()}
                                >
                                    {isSending ? '发送中...' : '发送'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="dh-panel-card">
                        <div className="dh-panel-header">
                            <h3>📊 LLM 输出</h3>
                        </div>
                        <div className="dh-llm-output">
                            {llmOutput ? (
                                <pre className="dh-json-block dh-json-compact">
                                    {JSON.stringify(llmOutput, null, 2)}
                                </pre>
                            ) : (
                                <div className="dh-empty-state">
                                    暂无输出
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="dh-panel-card">
                        <div className="dh-panel-header">
                            <h3>📈 数据流</h3>
                        </div>
                        <div className="dh-data-stream">
                            {dataStreamLog.length === 0 ? (
                                <div className="dh-empty-state">
                                    暂无数据流
                                </div>
                            ) : (
                                <pre className="dh-json-block dh-json-compact">
                                    {JSON.stringify(dataStreamLog.slice(-5), null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalHuman;
