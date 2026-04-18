import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCamera } from '../../hooks/useCamera';
import { emotionAnalysisApi } from '../../services/emotionAnalysisService';
import './EmotionAnalysis.css';

/**
 * 情绪常量映射
 */
const EMOTION_MAP = {
  neutral: { label: '中性', emoji: '😐', color: '#9CA3AF' },
  happy: { label: '开心', emoji: '😊', color: '#FCD34D' },
  sad: { label: '悲伤', emoji: '😢', color: '#60A5FA' },
  surprise: { label: '惊讶', emoji: '😮', color: '#F472B6' },
  fear: { label: '恐惧', emoji: '😨', color: '#A78BFA' },
  disgust: { label: '厌恶', emoji: '🤢', color: '#34D399' },
  angry: { label: '愤怒', emoji: '😠', color: '#EF4444' },
  contempt: { label: '轻蔑', emoji: '😤', color: '#F97316' },
};

const FUSION_EMOTIONS = [
  { key: 'neutral', label: '中性', emoji: '😐' },
  { key: 'happy', label: '开心', emoji: '😊' },
  { key: 'sad', label: '悲伤', emoji: '😢' },
  { key: 'surprise', label: '惊讶', emoji: '😮' },
  { key: 'fear', label: '恐惧', emoji: '😨' },
  { key: 'disgust', label: '厌恶', emoji: '🤢' },
  { key: 'angry', label: '愤怒', emoji: '😠' },
  { key: 'contempt', label: '轻蔑', emoji: '😤' },
];

/**
 * 情绪识别监测页面
 */
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
  } = useCamera(3000);

  // 监测状态
  const [isMonitoring, setIsMonitoring] = useState(false);
  // 'initial' - 首次进入, 'checking' - 正在检测, 'local' - 本地模拟模式,
  // 'loading' - Python服务加载中, 'ready' - Python服务已就绪, 'error' - 服务错误
  const [serviceStatus, setServiceStatus] = useState('initial');
  const [loadingTime, setLoadingTime] = useState(0);
  const [useLocalMode, setUseLocalMode] = useState(false);
  // Python 服务是否在线（影响弹窗显示内容）
  const [pythonOnline, setPythonOnline] = useState(false);

  // 分析结果
  const [videoEmotion, setVideoEmotion] = useState(null);
  const [audioEmotion, setAudioEmotion] = useState(null);
  const [textEmotion, setTextEmotion] = useState(null);
  const [fusedEmotion, setFusedEmotion] = useState(null);
  const [fusionDistribution, setFusionDistribution] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [snownlpScore, setSnownlpScore] = useState(null);
  const [snownlpLabel, setSnownlpLabel] = useState('中性');

  // 历史记录
  const [emotionHistory, setEmotionHistory] = useState([]);

  // 轮询定时器
  const pollTimerRef = useRef(null);
  const loadingTimerRef = useRef(null);

  /**
   * 静默检查服务状态（不弹 toast）
   */
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



  

  

  /**
   * 初始化时静默检测 Python 服务可用性
   * 无论服务是否在线，始终显示弹窗让用户选择模式
   */
  useEffect(() => {
    const init = async () => {
      setServiceStatus('checking');
      const ready = await checkServiceStatus();
      setPythonOnline(ready);
      // 始终显示弹窗（initial 状态），让用户自主选择
      setServiceStatus('initial');
    };
    init();

    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkServiceStatus]);

  /**
   * 自动启动 Python 推理服务
   */
  const startInferenceService = useCallback(async () => {
    setServiceStatus('loading');
    setLoadingTime(0);

    loadingTimerRef.current = setInterval(() => {
      setLoadingTime((prev) => prev + 1);
    }, 1000);

    try {
      await emotionAnalysisApi.startService();
      // 轮询等待服务就绪
      const maxRetries = 60;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 1000));
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

  /**
   * 连接在线 Python 推理服务
   */
  const connectOnlineService = useCallback(() => {
    setServiceStatus('ready');
    setUseLocalMode(false);
    toast.success('已连接 Python 推理服务');
  }, []);

  /**
   * 使用本地模拟模式
   */
  const useLocalModeHandler = useCallback(() => {
    setServiceStatus('local');
    setUseLocalMode(true);
    toast.success('已切换到本地模拟模式', { icon: '🖥️' });
  }, []);

  /**
   * 发送视频帧进行情绪分析（后端模式）
   */
  const analyzeFrame = useCallback(async () => {
    if (!latestFrame) return;

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
          setFusionDistribution(data.fusion_distribution);
        }

        if (data.transcribed_text) {
          setTranscribedText(data.transcribed_text);
        }

        if (data.snownlp_score !== undefined) {
          setSnownlpScore(data.snownlp_score);
          setSnownlpLabel(data.snownlp_label || '中性');
        }

        if (data.fused_emotion) {
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
    }
  }, [latestFrame]);

  

  

  /**
   * 本地模拟情绪分析（无需后端）
   */
  const localAnalyzeFrame = useCallback(() => {
    if (!latestFrame) return;

    const emotions = ['neutral', 'happy', 'sad', 'surprise', 'fear', 'disgust', 'angry', 'contempt'];
    const randomIdx = Math.floor(Math.random() * emotions.length);
    const randomEmotion = emotions[randomIdx];
    // confidence 使用 0-1 的小数
    const randomConfidence = (Math.random() * 0.4 + 0.3).toFixed(4);
    const confidenceVal = parseFloat(randomConfidence);

    setVideoEmotion({
      emotion: randomEmotion,
      confidence: confidenceVal,
    });

    // 音频模拟
    const audioEmotions = ['neutral', 'happy', 'sad'];
    const audioEmo = audioEmotions[Math.floor(Math.random() * audioEmotions.length)];
    setAudioEmotion({
      emotion: audioEmo,
      confidence: (Math.random() * 0.3 + 0.3),
    });

    // 文本模拟
    const textEmo = emotions[Math.floor(Math.random() * emotions.length)];
    setTextEmotion({
      emotion: textEmo,
      confidence: (Math.random() * 0.3 + 0.3),
    });

    // 融合情绪
    setFusedEmotion({
      emotion: randomEmotion,
      confidence: confidenceVal,
    });

    // 生成分布数据（0-1 范围）
    const distribution = {};
    let remaining = 1.0 - confidenceVal;
    emotions.forEach((e, i) => {
      if (e === randomEmotion) {
        distribution[e] = confidenceVal;
      } else if (i === emotions.length - 1) {
        distribution[e] = Math.max(0, remaining);
      } else {
        const val = Math.random() * (remaining / 2);
        distribution[e] = parseFloat(val.toFixed(4));
        remaining -= val;
      }
    });
    setFusionDistribution(distribution);

    // SnowNLP 模拟
    const score = parseFloat((Math.random() * 0.6 + 0.2).toFixed(4));
    setSnownlpScore(score);
    setSnownlpLabel(score > 0.6 ? '正面' : score > 0.4 ? '中性' : '负面');

    // 转写文字模拟
    const sampleTexts = [
      '今天心情还不错，感觉一切都很顺利。',
      '有点累了，想休息一下。',
      '这个问题让我有些困惑，需要再想想。',
      '突然收到一个好消息，很开心！',
      '感觉今天的压力有点大，需要放松。',
    ];
    setTranscribedText(sampleTexts[Math.floor(Math.random() * sampleTexts.length)]);

    // 添加到历史
    setEmotionHistory((prev) => {
      const newHistory = [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          emotion: randomEmotion,
          confidence: confidenceVal,
        },
      ];
      return newHistory.slice(-10);
    });
  }, [latestFrame]);

  // 开始监测
  const handleStartMonitoring = useCallback(async () => {
    if (!cameraEnabled) {
      await startCamera();
    }
    setIsMonitoring(true);
    toast.success('开始情绪监测');
  }, [cameraEnabled, startCamera]);

  // 停止监测
  const handleStopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    toast('已停止监测', { icon: '⏹️' });
  }, []);

  // 监测时定时分析
  useEffect(() => {
    if (isMonitoring && latestFrame) {
      // 立即分析一次
      if (useLocalMode) {
        localAnalyzeFrame();
      } else {
        analyzeFrame();
      }

      // 每3秒分析一次
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

  /**
   * 获取情绪配置
   */
  const getEmotionConfig = (key) => EMOTION_MAP[key] || EMOTION_MAP.neutral;

  /**
   * 格式化置信度为百分比
   */
  const formatConfidence = (confidence) => {
    if (confidence === null || confidence === undefined) return '0';
    // 兼容两种格式：0-1 小数 和 0-100 整数
    const val = typeof confidence === 'number' ? confidence : parseFloat(confidence);
    if (val > 1) return val.toFixed(1);
    return (val * 100).toFixed(1);
  };

  /**
   * 渲染情绪标签
   */
  const renderEmotionTag = (emotion, confidence) => {
    if (!emotion) return <span className="ea-unknown">未知</span>;
    const config = getEmotionConfig(emotion);
    return (
      <span className="ea-emotion-tag" style={{ color: config.color }}>
        {config.emoji} {config.label} {confidence ? `${formatConfidence(confidence)}%` : ''}
      </span>
    );
  };

  // 是否显示服务选择弹窗（首次进入 或 服务错误时）
  const showServiceModal = serviceStatus === 'initial' || serviceStatus === 'error';

  return (
    <div className="ea-page">
      {/* 顶部导航栏 */}
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

      {/* 主体内容 */}
      <div className="ea-content">
        {/* 左侧 - 实时视频流 */}
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

              {/* 情绪检测覆盖层 */}
              {isMonitoring && videoEmotion && (
                <div className="ea-video-overlay">
                  <div className="ea-detection-box">
                    <span className="ea-detection-label" style={{ background: getEmotionConfig(videoEmotion.emotion).color }}>
                      {getEmotionConfig(videoEmotion.emotion).label} {formatConfidence(videoEmotion.confidence)}%
                    </span>
                  </div>
                  <div className="ea-video-info">
                    <span>Audio: {audioEmotion ? getEmotionConfig(audioEmotion.emotion).label : '未知'}</span>
                    <span>Text: {textEmotion ? getEmotionConfig(textEmotion.emotion).label : '未知'}</span>
                  </div>
                </div>
              )}

              {/* 未启动摄像头时的占位 */}
              {!cameraEnabled && (
                <div className="ea-video-placeholder">
                  <div className="ea-placeholder-icon">📷</div>
                  <p>点击"开始监测"启动摄像头</p>
                </div>
              )}
            </div>

            {/* 控制按钮 */}
            <div className="ea-controls">
              <button
                className={`ea-btn ea-btn-start ${isMonitoring ? 'active' : ''}`}
                onClick={handleStartMonitoring}
                disabled={isMonitoring}
              >
                {isMonitoring ? '监测中...' : '▶ 开始监测'}
              </button>
              <button
                className="ea-btn ea-btn-stop"
                onClick={handleStopMonitoring}
                disabled={!isMonitoring}
              >
                ⏹ 停止监测
              </button>
            </div>

            {/* 摄像头错误 */}
            {cameraError && (
              <div className="ea-error-tip">
                ⚠️ 摄像头错误: {cameraError}
              </div>
            )}

            {/* 使用提示 */}
            <div className="ea-tips">
              <div className="ea-tips-header">💡 使用提示</div>
              <ul>
                <li>1. {useLocalMode
                  ? '当前为本地模拟模式，识别结果为模拟数据'
                  : '确保 Python 情绪识别服务已启动 (python infer_server.py)'}
                </li>
                <li>2. 确保摄像头正常工作且人脸在画面范围内</li>
                <li>3. 点击"开始监测"获取实时情绪数据</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 右侧 - 情绪分析结果 */}
        <div className="ea-right-panel">
          {/* 主情绪结果 */}
          <div className="ea-panel-card ea-result-card">
            <div className="ea-panel-header">
              <h3>🎯 情绪分析结果</h3>
            </div>

            <div className="ea-primary-result">
              <div className="ea-primary-emoji">
                {fusedEmotion
                  ? getEmotionConfig(fusedEmotion.emotion).emoji
                  : '😶'}
              </div>
              <div className="ea-primary-info">
                <div className="ea-primary-label">
                  {fusedEmotion
                    ? getEmotionConfig(fusedEmotion.emotion).label
                    : '等待检测...'}
                </div>
                <div className="ea-primary-confidence">
                  置信度: {fusedEmotion
                    ? `${formatConfidence(fusedEmotion.confidence)}%`
                    : '0%'}
                </div>
                <div className="ea-confidence-bar">
                  <div
                    className="ea-confidence-fill"
                    style={{
                      width: fusedEmotion ? `${Math.min(100, parseFloat(formatConfidence(fusedEmotion.confidence)))}%` : '0%',
                      background: fusedEmotion
                        ? getEmotionConfig(fusedEmotion.emotion).color
                        : '#9CA3AF',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 模态对比 */}
          <div className="ea-panel-card">
            <div className="ea-panel-header">
              <h3>📊 模态对比</h3>
            </div>
            <div className="ea-modal-comparison">
              <div className="ea-modal-item">
                <span className="ea-modal-icon">📹</span>
                <span className="ea-modal-label">视频识别</span>
                <span className="ea-modal-value">
                  {videoEmotion ? renderEmotionTag(videoEmotion.emotion, videoEmotion.confidence) : '未知'}
                </span>
              </div>
              <div className="ea-modal-item">
                <span className="ea-modal-icon">🔍</span>
                <span className="ea-modal-label">音频识别</span>
                <span className="ea-modal-value">
                  {audioEmotion ? renderEmotionTag(audioEmotion.emotion, audioEmotion.confidence) : '未知'}
                </span>
              </div>
              <div className="ea-modal-item">
                <span className="ea-modal-icon">📝</span>
                <span className="ea-modal-label">文本识别</span>
                <span className="ea-modal-value">
                  {textEmotion ? renderEmotionTag(textEmotion.emotion, textEmotion.confidence) : '未知'}
                </span>
              </div>
            </div>
          </div>

          {/* SnowNLP 情感分析 */}
          <div className="ea-panel-card">
            <div className="ea-panel-header">
              <h3>📝 SnowNLP 情感分析</h3>
            </div>
            <div className="ea-snownlp-section">
              {transcribedText && (
                <div className="ea-transcribed">
                  <span className="ea-transcribed-label">转写文字：</span>
                  <span className="ea-transcribed-text">{transcribedText}</span>
                </div>
              )}
              <div className="ea-snownlp-score">
                <span>SnowNLP 情感分值：</span>
                <strong>{snownlpScore !== null ? snownlpScore : '—'}</strong>
              </div>
              <div className="ea-sentiment-bar">
                <div className="ea-sentiment-gradient" />
                <div
                  className="ea-sentiment-indicator"
                  style={{ left: snownlpScore !== null ? `${snownlpScore * 100}%` : '50%' }}
                />
              </div>
              <div className="ea-sentiment-labels">
                <span>负面 (0)</span>
                <span>正面 (1)</span>
              </div>
              <div className="ea-snownlp-label">
                映射标签：<span className="ea-label-badge">{snownlpLabel}</span>
              </div>
            </div>
          </div>

          {/* 融合后详细分布 */}
          <div className="ea-panel-card">
            <div className="ea-panel-header">
              <h3>📈 融合后详细分布</h3>
            </div>
            <div className="ea-fusion-distribution">
              {FUSION_EMOTIONS.map(({ key, label, emoji }) => {
                const rawValue = fusionDistribution?.[key] || 0;
                const displayValue = formatConfidence(rawValue);
                return (
                  <div className="ea-distribution-item" key={key}>
                    <span className="ea-dist-emoji">{emoji}</span>
                    <span className="ea-dist-label">{label}</span>
                    <div className="ea-dist-bar">
                      <div
                        className="ea-dist-fill"
                        style={{
                          width: `${Math.min(100, parseFloat(displayValue))}%`,
                          background: getEmotionConfig(key).color,
                        }}
                      />
                    </div>
                    <span className="ea-dist-value">{displayValue}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 情绪历史 */}
          {emotionHistory.length > 0 && (
            <div className="ea-panel-card">
              <div className="ea-panel-header">
                <h3>🕐 近期情绪变化</h3>
              </div>
              <div className="ea-history-list">
                {emotionHistory.map((item, index) => (
                  <div className="ea-history-item" key={index}>
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
            </div>
          )}
        </div>
      </div>



      {/* 服务选择弹窗 */}
      {showServiceModal && (
        <div className="ea-modal-overlay">
          <div className="ea-modal-dialog">
            <div className="ea-modal-icon-header">🤖</div>
            <h3>情绪识别服务</h3>

            {pythonOnline ? (
              <>
                <div className="ea-modal-online-hint">
                  ✅ 已检测到 Python 推理服务在线（DeepFace + SnowNLP 已就绪）
                </div>
                <p>您可以选择连接在线服务获取真实情绪识别，或使用本地模拟模式体验</p>
              </>
            ) : (
              <>
                <p>首次使用需启动 Python 推理服务（加载 DeepFace 模型约需 20~40 秒）</p>
                <p className="ea-modal-hint">
                  如果后端服务不可用，也可以使用本地模拟模式进行体验
                </p>
              </>
            )}

            {serviceStatus === 'error' && (
              <div className="ea-modal-error">
                服务启动失败，建议使用本地模拟模式
              </div>
            )}

            <div className="ea-modal-actions">
              {pythonOnline ? (
                <button className="ea-btn ea-btn-primary" onClick={connectOnlineService}>
                  🔗 连接在线服务
                </button>
              ) : (
                <button className="ea-btn ea-btn-primary" onClick={startInferenceService}>
                  ▶ 自动启动服务
                </button>
              )}
              <button
                className="ea-btn ea-btn-secondary"
                onClick={useLocalModeHandler}
              >
                🖥 使用本地模拟
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载中弹窗 */}
      {serviceStatus === 'loading' && (
        <div className="ea-modal-overlay">
          <div className="ea-modal-dialog">
            <div className="ea-modal-icon-header loading">⏳</div>
            <h3>正在加载模型...</h3>
            <p>正在启动 Python 推理服务，请耐心等待</p>
            <div className="ea-loading-progress">
              <div className="ea-loading-bar">
                <div
                  className="ea-loading-fill"
                  style={{ width: `${Math.min(100, (loadingTime / 40) * 100)}%` }}
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
    </div>
  );
};

export default EmotionAnalysis;
