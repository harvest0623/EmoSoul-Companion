import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCamera } from '../../hooks/useCamera';
import { emotionAnalysisApi } from '../../services/emotionAnalysisService';
import './EmotionAnalysis.css';

const EMOTION_MAP = {
    happy: { label: '开心', emoji: '😊', color: '#FCD34D' },
    sad: { label: '悲伤', emoji: '😢', color: '#60A5FA' },
    angry: { label: '愤怒', emoji: '😠', color: '#EF4444' },
    surprised: { label: '惊讶', emoji: '😮', color: '#F472B6' },
    anxious: { label: '焦虑', emoji: '😨', color: '#A78BFA' },
    calm: { label: '平静', emoji: '😌', color: '#9CA3AF' },
    thinking: { label: '思考', emoji: '🤔', color: '#6EE7B7' },
    love: { label: '爱意', emoji: '🥰', color: '#F9A8D4' },
    neutral: { label: '平静', emoji: '😌', color: '#9CA3AF' },
    fear: { label: '焦虑', emoji: '😨', color: '#A78BFA' },
    disgust: { label: '愤怒', emoji: '😠', color: '#EF4444' },
    contempt: { label: '愤怒', emoji: '😠', color: '#EF4444' },
};

const FUSION_EMOTIONS = [
    { key: 'happy', label: '开心', emoji: '😊' },
    { key: 'sad', label: '悲伤', emoji: '😢' },
    { key: 'angry', label: '愤怒', emoji: '😠' },
    { key: 'surprised', label: '惊讶', emoji: '😮' },
    { key: 'anxious', label: '焦虑', emoji: '😨' },
    { key: 'calm', label: '平静', emoji: '😌' },
    { key: 'thinking', label: '思考', emoji: '🤔' },
    { key: 'love', label: '爱意', emoji: '🥰' },
];

const EmotionAnalysis = () => {
    const navigate = useNavigate();
    const {
        isEnabled: cameraEnabled,
        latestFrame,
        error: cameraError,
        startCamera,
        stopCamera,
        videoRef,
        canvasRef,
    } = useCamera(1000);

    const [isMonitoring, setIsMonitoring] = useState(false);
    const [serviceStatus, setServiceStatus] = useState('initial');
    const [loadingTime, setLoadingTime] = useState(0);
    const [useLocalMode, setUseLocalMode] = useState(false);
    const [serviceOnline, setServiceOnline] = useState(false);

    const smootherRef = useRef({
        emaDistribution: null,
        emaAlpha: 0.7,
        lastEmotion: null,
        stableCount: 0,
        windowSize: 3,
        update(distribution, confidence) {
            if (!distribution) return null;
            const emotions = ['happy', 'sad', 'angry', 'surprised', 'anxious', 'calm', 'thinking', 'love'];

            if (!this.emaDistribution) {
                this.emaDistribution = { ...distribution };
            } else {
                const alpha = this.emaAlpha;
                this.emaDistribution = Object.fromEntries(
                    emotions.map(emo => [
                        emo,
                        Math.round((alpha * (distribution[emo] || 0) + (1 - alpha) * (this.emaDistribution[emo] || 0)) * 10000) / 10000,
                    ])
                );
                const total = Object.values(this.emaDistribution).reduce((a, b) => a + b, 0);
                if (total > 0) {
                    this.emaDistribution = Object.fromEntries(
                        Object.entries(this.emaDistribution).map(([k, v]) => [k, Math.round((v / total) * 10000) / 10000])
                    );
                }
            }

            const currentEmotion = Object.entries(this.emaDistribution)
                .sort((a, b) => b[1] - a[1])[0][0];
            if (currentEmotion === this.lastEmotion) {
                this.stableCount++;
            } else {
                this.stableCount = 1;
                this.lastEmotion = currentEmotion;
            }

            return this.emaDistribution;
        },
        getStabilityScore() {
            return Math.min(1.0, this.stableCount / this.windowSize);
        },
        reset() {
            this.emaDistribution = null;
            this.lastEmotion = null;
            this.stableCount = 0;
        },
    });

    const [videoEmotion, setVideoEmotion] = useState(null);
    const [audioEmotion, setAudioEmotion] = useState(null);
    const [textEmotion, setTextEmotion] = useState(null);
    const [fusedEmotion, setFusedEmotion] = useState(null);
    const [fusionDistribution, setFusionDistribution] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [snownlpScore, setSnownlpScore] = useState(null);
    const [snownlpLabel, setSnownlpLabel] = useState('中性');

    const [emotionHistory, setEmotionHistory] = useState([]);

    const pollTimerRef = useRef(null);
    const loadingTimerRef = useRef(null);
    const isAnalyzingRef = useRef(false);

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
            setServiceOnline(ready);
            setServiceStatus('initial');
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
            setLoadingTime((prev) => prev + 1);
        }, 1000);

        try {
            await emotionAnalysisApi.startService();
            const ready = await checkServiceStatus();
            clearInterval(loadingTimerRef.current);
            if (ready) {
                setServiceStatus('ready');
                setUseLocalMode(false);
                toast.success('Coze 情绪识别服务已就绪');
            } else {
                setServiceStatus('error');
                toast.error('Coze 工作流未配置，请检查后端 .env');
            }
        } catch {
            clearInterval(loadingTimerRef.current);
            setServiceStatus('error');
            toast.error('服务连接失败，请使用本地模拟模式');
        }
    }, [checkServiceStatus]);

    const connectOnlineService = useCallback(() => {
        setServiceStatus('ready');
        setUseLocalMode(false);
        toast.success('已连接 Coze 情绪分析服务');
    }, []);

    const useLocalModeHandler = useCallback(() => {
        setServiceStatus('local');
        setUseLocalMode(true);
        toast.success('已切换到本地模拟模式', { icon: '🖥️' });
    }, []);

    const analyzeFrame = useCallback(async () => {
        if (!latestFrame) return;
        if (isAnalyzingRef.current) return;
        isAnalyzingRef.current = true;

        try {
            const res = await emotionAnalysisApi.analyzeFrame({
                image: latestFrame,
            });

            if (res.code === 200 && res.data) {
                const data = res.data;

                if (data.video_emotion) {
                    setVideoEmotion({
                        emotion: data.video_emotion,
                        confidence: data.video_confidence || 0,
                    });
                }

                if (data.audio_emotion) {
                    setAudioEmotion({
                        emotion: data.audio_emotion,
                        confidence: data.audio_confidence || 0,
                    });
                }

                if (data.text_emotion) {
                    setTextEmotion({
                        emotion: data.text_emotion,
                        confidence: data.text_confidence || 0,
                    });
                }

                if (data.fused_emotion) {
                    setFusedEmotion({
                        emotion: data.fused_emotion,
                        confidence: data.fused_confidence || 0,
                    });
                }

                if (data.fusion_distribution) {
                    const smoothed = smootherRef.current.update(data.fusion_distribution, data.fused_confidence || 0);
                    if (smoothed) {
                        setFusionDistribution(smoothed);
                        const sortedEntries = Object.entries(smoothed).sort((a, b) => b[1] - a[1]);
                        const [topEmo, topConf] = sortedEntries[0];
                        setFusedEmotion({ emotion: topEmo, confidence: topConf });
                        const stability = smootherRef.current.getStabilityScore();
                        if (stability > 0.6 && topConf > 0.3) {
                            const boostedConf = Math.min(0.95, Math.round(topConf * (1 + stability * 0.1) * 10000) / 10000);
                            setFusedEmotion({ emotion: topEmo, confidence: boostedConf });
                        }
                    } else {
                        setFusionDistribution(data.fusion_distribution);
                    }
                }

                if (data.transcribed_text) {
                    setTranscribedText(data.transcribed_text);
                }

                if (data.snownlp_score !== undefined) {
                    setSnownlpScore(data.snownlp_score);
                    setSnownlpLabel(data.snownlp_label || '中性');
                }

                if (data.fused_emotion) {
                    console.log(
                        `[EmotionAnalysis] 后端结果: 视频=${data.video_emotion || '无'} (${(data.video_confidence * 100).toFixed(1)}%), ` +
                        `文本=${data.text_emotion || '无'}, ` +
                        `融合=${data.fused_emotion} (${(data.fused_confidence * 100).toFixed(1)}%), ` +
                        `稳定性=${(data.stability_score * 100).toFixed(0)}%`
                    );
                    setEmotionHistory((prev) => {
                        const newHistory = [
                            ...prev,
                            {
                                time: new Date().toLocaleTimeString(),
                                emotion: data.fused_emotion,
                                confidence: data.fused_confidence || 0,
                            },
                        ];
                        return newHistory.slice(-10);
                    });
                }
            }
        } catch (err) {
            console.error('情绪分析失败:', err);
        } finally {
            isAnalyzingRef.current = false;
        }
    }, [latestFrame]);

    const localAnalyzeFrame = useCallback(async () => {
        if (!latestFrame) return;

        const emotions = ['happy', 'sad', 'angry', 'surprised', 'anxious', 'calm', 'thinking', 'love'];

        const prevVideoEmo = videoEmotion?.emotion;
        let randomEmotion;
        let confidenceVal;

        if (prevVideoEmo && Math.random() < 0.7) {
            randomEmotion = prevVideoEmo;
            confidenceVal = parseFloat((Math.random() * 0.15 + 0.45).toFixed(4));
        } else {
            const weights = [0.12, 0.06, 0.05, 0.06, 0.05, 0.42, 0.12, 0.12];
            const rand = Math.random();
            let cumWeight = 0;
            randomEmotion = 'calm';
            for (let i = 0; i < emotions.length; i++) {
                cumWeight += weights[i];
                if (rand < cumWeight) {
                    randomEmotion = emotions[i];
                    break;
                }
            }
            confidenceVal = parseFloat((Math.random() * 0.2 + 0.3).toFixed(4));
        }

        setVideoEmotion({
            emotion: randomEmotion,
            confidence: confidenceVal,
        });

        let textEmo = null;
        let textConf = null;
        try {
            const res = await emotionAnalysisApi.analyzeFrame({
                text: transcribedText || '',
            });
            if (res?.code === 200 && res.data?.text_emotion) {
                textEmo = res.data.text_emotion;
                textConf = res.data.text_confidence || 0;
            }
        } catch {
        }

        if (!textEmo) {
            textEmo = Math.random() < 0.65 ? randomEmotion : emotions[Math.floor(Math.random() * emotions.length)];
            textConf = parseFloat((Math.random() * 0.2 + 0.3).toFixed(4));
        }
        setTextEmotion({ emotion: textEmo, confidence: textConf });

        const audioEmo = Math.random() < 0.6 ? randomEmotion : emotions[Math.floor(Math.random() * emotions.length)];
        setAudioEmotion({
            emotion: audioEmo,
            confidence: parseFloat((Math.random() * 0.2 + 0.25).toFixed(4)),
        });

        const videoWeight = confidenceVal >= (textConf || 0) ? 0.6 : 0.4;
        const textWeight = 1 - videoWeight;
        const distribution = {};
        emotions.forEach(e => {
            const vPart = e === randomEmotion ? confidenceVal : (1 - confidenceVal) / (emotions.length - 1);
            const tPart = e === textEmo ? (textConf || 0.3) : (1 - (textConf || 0.3)) / (emotions.length - 1);
            distribution[e] = parseFloat((vPart * videoWeight + tPart * textWeight).toFixed(4));
        });
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        for (const k of Object.keys(distribution)) {
            distribution[k] = parseFloat((distribution[k] / total).toFixed(4));
        }

        const smoothed = smootherRef.current.update(distribution, confidenceVal);
        const finalDist = smoothed || distribution;

        const sortedEntries = Object.entries(finalDist).sort((a, b) => b[1] - a[1]);
        const [fusedEmo, fusedConf] = sortedEntries[0];

        setFusedEmotion({ emotion: fusedEmo, confidence: fusedConf });
        setFusionDistribution(finalDist);

        const score = fusedEmo === 'happy' || fusedEmo === 'love'
            ? parseFloat((Math.random() * 0.3 + 0.6).toFixed(4))
            : fusedEmo === 'sad' || fusedEmo === 'angry' || fusedEmo === 'anxious'
                ? parseFloat((Math.random() * 0.3 + 0.1).toFixed(4))
                : parseFloat((Math.random() * 0.2 + 0.4).toFixed(4));
        setSnownlpScore(score);
        setSnownlpLabel(score > 0.6 ? '正面' : score > 0.4 ? '中性' : '负面');

        const sampleTexts = [
            '今天心情还不错，感觉一切都很顺利。',
            '有点累了，想休息一下。',
            '这个问题让我有些困惑，需要再想想。',
            '突然收到一个好消息，很开心！',
            '感觉今天的压力有点大，需要放松。',
        ];
        setTranscribedText(sampleTexts[Math.floor(Math.random() * sampleTexts.length)]);

        setEmotionHistory((prev) => {
            const newHistory = [
                ...prev,
                {
                    time: new Date().toLocaleTimeString(),
                    emotion: fusedEmo,
                    confidence: fusedConf,
                },
            ];
            return newHistory.slice(-10);
        });
    }, [latestFrame, videoEmotion, transcribedText]);

    const handleStartMonitoring = useCallback(async () => {
        if (!cameraEnabled) {
            await startCamera();
        }
        setIsMonitoring(true);
        toast.success('开始情绪监测');
    }, [cameraEnabled, startCamera]);

    const handleStopMonitoring = useCallback(() => {
        setIsMonitoring(false);
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        smootherRef.current.reset();
        toast('已停止监测', { icon: '⏹️' });
    }, []);

    useEffect(() => {
        if (isMonitoring && latestFrame) {
            if (useLocalMode) {
                localAnalyzeFrame();
            } else {
                analyzeFrame();
            }

            const interval = useLocalMode ? 2000 : 1000;
            pollTimerRef.current = setInterval(() => {
                if (useLocalMode) {
                    localAnalyzeFrame();
                } else {
                    analyzeFrame();
                }
            }, interval);
        }

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [isMonitoring, latestFrame, useLocalMode, analyzeFrame, localAnalyzeFrame]);

    const getEmotionConfig = (key) => EMOTION_MAP[key] || EMOTION_MAP.neutral;

    const formatConfidence = (confidence) => {
        if (confidence === null || confidence === undefined) return '0';
        const val = typeof confidence === 'number' ? confidence : parseFloat(confidence);
        if (val > 1) return val.toFixed(1);
        return (val * 100).toFixed(1);
    };

    const renderEmotionTag = (emotion, confidence) => {
        if (!emotion) return <span className="ea-unknown">未知</span>;
        const config = getEmotionConfig(emotion);
        return (
            <span className="ea-emotion-tag" style={{ color: config.color }}>
                {config.emoji} {config.label} {confidence ? `${formatConfidence(confidence)}%` : ''}
            </span>
        );
    };

    const showServiceModal = serviceStatus === 'initial' || serviceStatus === 'error';

    return (
        <div className="ea-page">
            <header className="ea-header">
                <button className="ea-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="ea-title">🫠 情绪识别监测</h1>
                <div className="ea-header-actions">
                    <span className={`ea-connection-badge ${serviceStatus === 'ready' ? 'connected' : ''}`}>
                        {serviceStatus === 'ready' ? '已连接' : useLocalMode ? '本地模式' : '未连接'}
                    </span>
                </div>
            </header>

            {showServiceModal && (
                <div className="ea-modal-overlay">
                    <div className="ea-modal-dialog">
                        <div className="ea-modal-icon-header">🧠</div>
                        <h3>情绪识别服务</h3>
                        <p>首次使用需选择服务模式</p>
                        {serviceOnline && (
                            <div className="ea-modal-online-hint">
                                ✓ Coze 工作流已在线，可直接连接
                            </div>
                        )}
                        <p className="ea-modal-hint">
                            也可以使用本地模拟模式进行体验
                        </p>
                        {serviceStatus === 'error' && (
                            <div className="ea-modal-error">
                                服务连接失败，建议使用本地模拟模式
                            </div>
                        )}
                        <div className="ea-modal-actions">
                            {serviceOnline && (
                                <button className="ea-btn ea-btn-primary" onClick={connectOnlineService}>
                                    ☁️ 连接在线服务
                                </button>
                            )}
                            <button className="ea-btn ea-btn-secondary" onClick={startInferenceService}>
                                🚀 启动本地服务
                            </button>
                            <button className="ea-btn ea-btn-secondary" onClick={useLocalModeHandler}>
                                🖥️ 使用本地模拟
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {serviceStatus === 'loading' && (
                <div className="ea-modal-overlay">
                    <div className="ea-modal-dialog">
                        <div className="ea-modal-icon-header loading">⏳</div>
                        <h3>正在加载服务...</h3>
                        <p>正在启动情绪识别服务，请耐心等待</p>
                        <div className="ea-loading-progress">
                            <div className="ea-loading-bar">
                                <div
                                    className="ea-loading-fill"
                                    style={{ width: `${Math.min(100, (loadingTime / 60) * 100)}%` }}
                                />
                            </div>
                            <span className="ea-loading-time">已等待 {loadingTime}s</span>
                        </div>
                        <button className="ea-btn ea-btn-secondary ea-cancel-btn" onClick={useLocalModeHandler}>
                            取消，使用本地模拟
                        </button>
                    </div>
                </div>
            )}

            <div className="ea-content">
                <div className="ea-left-panel">
                    <div className="ea-panel-card">
                        <div className="ea-panel-header">
                            <h3>📹 实时视频流</h3>
                            <span className={`ea-connection-badge ${serviceStatus === 'ready' ? 'connected' : ''}`}>
                                {serviceStatus === 'ready' ? '已连接' : useLocalMode ? '本地模式' : '未连接'}
                            </span>
                        </div>

                        <div className="ea-video-container">
                            <video
                                ref={videoRef}
                                className="ea-video"
                                autoPlay
                                playsInline
                                muted
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {isMonitoring && videoEmotion && (
                                <div className="ea-video-overlay">
                                    <div className="ea-detection-box">
                                        <span className="ea-detection-label" style={{ background: getEmotionConfig(videoEmotion.emotion).color }}>
                                            {getEmotionConfig(videoEmotion.emotion).label} {formatConfidence(videoEmotion.confidence)}%
                                        </span>
                                    </div>
                                    <div className="ea-video-info">
                                        <span>视频情绪: {getEmotionConfig(videoEmotion.emotion).label}</span>
                                    </div>
                                </div>
                            )}

                            {!cameraEnabled && (
                                <div className="ea-video-placeholder">
                                    <div className="ea-placeholder-icon">📷</div>
                                    <p>点击下方按钮启动摄像头</p>
                                </div>
                            )}
                        </div>

                        <div className="ea-controls">
                            <button
                                className={`ea-btn ${isMonitoring ? 'ea-btn-stop' : 'ea-btn-start'}`}
                                onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
                            >
                                {isMonitoring ? '⏹ 停止监测' : '▶ 开始监测'}
                            </button>
                        </div>

                        {cameraError && (
                            <div className="ea-error-tip">⚠️ 摄像头错误: {cameraError}</div>
                        )}

                        {!cameraEnabled && !cameraError && (
                            <div className="ea-tips">
                                <div className="ea-tips-header">💡 使用提示</div>
                                <ul>
                                    <li>点击「开始监测」按钮启动摄像头</li>
                                    <li>确保在光线充足的环境下使用</li>
                                    <li>正对摄像头可以获得更好的识别效果</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ea-right-panel">
                    <div className="ea-panel-card ea-result-card">
                        <div className="ea-panel-header">
                            <h3>🧠 融合情绪结果</h3>
                        </div>

                        {fusedEmotion ? (
                            <div className="ea-primary-result">
                                <div className="ea-primary-emoji">
                                    {getEmotionConfig(fusedEmotion.emotion).emoji}
                                </div>
                                <div className="ea-primary-info">
                                    <div className="ea-primary-label">
                                        {getEmotionConfig(fusedEmotion.emotion).label}
                                    </div>
                                    <div className="ea-primary-confidence">
                                        置信度: {formatConfidence(fusedEmotion.confidence)}%
                                    </div>
                                    <div className="ea-confidence-bar">
                                        <div
                                            className="ea-confidence-fill"
                                            style={{
                                                width: `${formatConfidence(fusedEmotion.confidence)}%`,
                                                background: getEmotionConfig(fusedEmotion.emotion).color
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="ea-empty-state">
                                <div className="ea-empty-icon">🧠</div>
                                <p>开始监测后结果显示在这里</p>
                            </div>
                        )}
                    </div>

                    <div className="ea-panel-card">
                        <div className="ea-panel-header">
                            <h3>🔍 多模态对比</h3>
                        </div>
                        <div className="ea-modal-comparison">
                            <div className="ea-modal-item">
                                <span className="ea-modal-icon">🎥</span>
                                <span className="ea-modal-label">视频情绪</span>
                                {renderEmotionTag(videoEmotion?.emotion, videoEmotion?.confidence)}
                            </div>
                            <div className="ea-modal-item">
                                <span className="ea-modal-icon">🎤</span>
                                <span className="ea-modal-label">音频情绪</span>
                                {renderEmotionTag(audioEmotion?.emotion, audioEmotion?.confidence)}
                            </div>
                            <div className="ea-modal-item">
                                <span className="ea-modal-icon">💬</span>
                                <span className="ea-modal-label">文本情绪</span>
                                {renderEmotionTag(textEmotion?.emotion, textEmotion?.confidence)}
                            </div>
                        </div>
                    </div>

                    <div className="ea-panel-card">
                        <div className="ea-panel-header">
                            <h3>📊 融合分布</h3>
                        </div>
                        {fusionDistribution ? (
                            <div className="ea-fusion-distribution">
                                {FUSION_EMOTIONS.map(({ key, label, emoji }) => {
                                    const value = fusionDistribution[key] || 0;
                                    const percentage = (value * 100).toFixed(1);
                                    return (
                                        <div key={key} className="ea-distribution-item">
                                            <span className="ea-dist-emoji">{emoji}</span>
                                            <span className="ea-dist-label">{label}</span>
                                            <div className="ea-dist-bar">
                                                <div
                                                    className="ea-dist-fill"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: EMOTION_MAP[key]?.color || '#9CA3AF'
                                                    }}
                                                />
                                            </div>
                                            <span className="ea-dist-value">{percentage}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="ea-empty-state">
                                <p>开始监测后显示情绪分布</p>
                            </div>
                        )}
                    </div>

                    <div className="ea-panel-card">
                        <div className="ea-panel-header">
                            <h3>📝 SnowNLP 文本情感分析</h3>
                        </div>
                        <div className="ea-snownlp-section">
                            {transcribedText && (
                                <div className="ea-transcribed">
                                    <span className="ea-transcribed-label">转写文本: </span>
                                    <span className="ea-transcribed-text">{transcribedText}</span>
                                </div>
                            )}
                            {snownlpScore !== null && (
                                <>
                                    <div className="ea-snownlp-score">
                                        情感得分: <strong>{snownlpScore.toFixed(4)}</strong>
                                        <span className="ea-label-badge" style={{
                                            marginLeft: '8px',
                                            background: snownlpScore > 0.6 ? 'rgba(34, 197, 94, 0.15)' : snownlpScore > 0.4 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            borderColor: snownlpScore > 0.6 ? 'rgba(34, 197, 94, 0.2)' : snownlpScore > 0.4 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: snownlpScore > 0.6 ? '#22c55e' : snownlpScore > 0.4 ? '#fbbf24' : '#ef4444'
                                        }}>
                                            {snownlpLabel}
                                        </span>
                                    </div>
                                    <div className="ea-sentiment-bar">
                                        <div className="ea-sentiment-gradient" />
                                        <div
                                            className="ea-sentiment-indicator"
                                            style={{ left: `${snownlpScore * 100}%` }}
                                        />
                                    </div>
                                    <div className="ea-sentiment-labels">
                                        <span>负面</span>
                                        <span>中性</span>
                                        <span>正面</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="ea-panel-card">
                        <div className="ea-panel-header">
                            <h3>📜 情绪历史</h3>
                        </div>
                        {emotionHistory.length > 0 ? (
                            <div className="ea-history-list">
                                {emotionHistory.map((item, index) => (
                                    <div key={index} className="ea-history-item">
                                        <span className="ea-history-time">{item.time}</span>
                                        <span className="ea-history-emoji">
                                            {getEmotionConfig(item.emotion).emoji}
                                        </span>
                                        <span className="ea-history-label">
                                            {getEmotionConfig(item.emotion).label}
                                        </span>
                                        <span className="ea-history-confidence">
                                            {formatConfidence(item.confidence)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ea-empty-state">
                                <p>暂无历史记录</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmotionAnalysis;
