import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCamera } from '../../hooks/useCamera';
import { emotionAnalysisApi } from '../../services/emotionAnalysisService';
import './EmotionAnalysis.css';

/**
 * 情绪常量映射（与后端 8 分类对齐）
 */
const EMOTION_MAP = {
  happy: { label: '开心', emoji: '😊', color: '#FCD34D' },
  sad: { label: '悲伤', emoji: '😢', color: '#60A5FA' },
  angry: { label: '愤怒', emoji: '😠', color: '#EF4444' },
  surprised: { label: '惊讶', emoji: '😮', color: '#F472B6' },
  anxious: { label: '焦虑', emoji: '😨', color: '#A78BFA' },
  calm: { label: '平静', emoji: '😌', color: '#9CA3AF' },
  thinking: { label: '思考', emoji: '🤔', color: '#6EE7B7' },
  love: { label: '爱意', emoji: '🥰', color: '#F9A8D4' },
  // 兼容旧版 DeepFace 7 分类映射
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
  } = useCamera(1000);

  // 监测状态
  const [isMonitoring, setIsMonitoring] = useState(false);
  // 'initial' - 首次进入, 'checking' - 正在检测, 'local' - 本地模拟模式,
  // 'loading' - 服务加载中, 'ready' - 服务已就绪, 'error' - 服务错误
  const [serviceStatus, setServiceStatus] = useState('initial');
  const [loadingTime, setLoadingTime] = useState(0);
  const [useLocalMode, setUseLocalMode] = useState(false);
  // Coze 工作流是否在线（影响弹窗显示内容）
  const [serviceOnline, setServiceOnline] = useState(false);

  // 时间窗平滑器（前端）
  // 注意：后端已做平滑，前端仅做轻度平滑（alpha=0.7 = 新帧占 70%）
  // 避免双重平滑导致响应过慢
  const smootherRef = useRef({
    emaDistribution: null,
    emaAlpha: 0.7,
    lastEmotion: null,
    stableCount: 0,
    windowSize: 3,
    update(distribution, confidence) {
      if (!distribution) return null;
      const emotions = ['happy', 'sad', 'angry', 'surprised', 'anxious', 'calm', 'thinking', 'love'];

      // EMA 平滑（轻度）
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
        // 归一化
        const total = Object.values(this.emaDistribution).reduce((a, b) => a + b, 0);
        if (total > 0) {
          this.emaDistribution = Object.fromEntries(
            Object.entries(this.emaDistribution).map(([k, v]) => [k, Math.round((v / total) * 10000) / 10000])
          );
        }
      }

      // 稳定性
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
  // 防止请求堆积：标记是否有请求正在进行中
  const isAnalyzingRef = useRef(false);

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
   * 初始化时静默检测 Coze 工作流可用性
   * 无论服务是否在线，始终显示弹窗让用户选择模式
   */
  useEffect(() => {
    const init = async () => {
      setServiceStatus('checking');
      const ready = await checkServiceStatus();
      setServiceOnline(ready);
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
   * 连接 Coze 情绪分析工作流
   */
  const startInferenceService = useCallback(async () => {
    setServiceStatus('loading');
    setLoadingTime(0);

    loadingTimerRef.current = setInterval(() => {
      setLoadingTime((prev) => prev + 1);
    }, 1000);

    try {
      await emotionAnalysisApi.startService();
      // 检查服务是否就绪
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

  /**
   * 连接在线 Coze 情绪分析服务
   */
  const connectOnlineService = useCallback(() => {
    setServiceStatus('ready');
    setUseLocalMode(false);
    toast.success('已连接 Coze 情绪分析服务');
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
   * 使用 isAnalyzingRef 防止请求堆积（Coze 工作流响应较慢，约 7-9 秒）
   */
  const analyzeFrame = useCallback(async () => {
    if (!latestFrame) return;
    if (isAnalyzingRef.current) return; // 上一次还没返回，跳过
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
          // 前端时间窗平滑
          const smoothed = smootherRef.current.update(data.fusion_distribution, data.fused_confidence || 0);
          if (smoothed) {
            setFusionDistribution(smoothed);
            // 重新从平滑分布中提取主导情绪
            const sortedEntries = Object.entries(smoothed).sort((a, b) => b[1] - a[1]);
            const [topEmo, topConf] = sortedEntries[0];
            setFusedEmotion({ emotion: topEmo, confidence: topConf });
            // 稳定性加成
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

  /**
   * 本地模拟情绪分析（基于规则的智能模拟）
   * 视频模态：基于帧亮度/色调等简单特征推断 + 时间一致性
   * 文本模态：调用后端 EmotionService 做真实文本分析
   * 整体：不纯粹随机，而是有规律地模拟
   */
  const localAnalyzeFrame = useCallback(async () => {
    if (!latestFrame) return;

    const emotions = ['happy', 'sad', 'angry', 'surprised', 'anxious', 'calm', 'thinking', 'love'];

    // ---- 视频模态模拟 ----
    // 利用前帧结果 + 小幅扰动模拟视频情绪的连续性
    const prevVideoEmo = videoEmotion?.emotion;
    let randomEmotion;
    let confidenceVal;

    if (prevVideoEmo && Math.random() < 0.7) {
      // 70% 概率保持与上一帧一致（模拟视频情绪的连续性）
      randomEmotion = prevVideoEmo;
      confidenceVal = parseFloat((Math.random() * 0.15 + 0.45).toFixed(4)); // 0.45~0.60
    } else {
      // 30% 概率切换，权重偏向 calm/happy
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
      confidenceVal = parseFloat((Math.random() * 0.2 + 0.3).toFixed(4)); // 0.30~0.50
    }

    setVideoEmotion({
      emotion: randomEmotion,
      confidence: confidenceVal,
    });

    // ---- 文本模态 ----
    // 尝试调用后端文本分析服务
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
      // 后端不可用，降级
    }

    if (!textEmo) {
      // 后端不可用时，模拟文本情绪（倾向与视频一致）
      textEmo = Math.random() < 0.65 ? randomEmotion : emotions[Math.floor(Math.random() * emotions.length)];
      textConf = parseFloat((Math.random() * 0.2 + 0.3).toFixed(4));
    }
    setTextEmotion({ emotion: textEmo, confidence: textConf });

    // ---- 音频模态模拟 ----
    const audioEmo = Math.random() < 0.6 ? randomEmotion : emotions[Math.floor(Math.random() * emotions.length)];
    setAudioEmotion({
      emotion: audioEmo,
      confidence: parseFloat((Math.random() * 0.2 + 0.25).toFixed(4)),
    });

    // ---- 融合 ----
    // 简单加权融合分布
    const videoWeight = confidenceVal >= (textConf || 0) ? 0.6 : 0.4;
    const textWeight = 1 - videoWeight;
    const distribution = {};
    emotions.forEach(e => {
      const vPart = e === randomEmotion ? confidenceVal : (1 - confidenceVal) / (emotions.length - 1);
      const tPart = e === textEmo ? (textConf || 0.3) : (1 - (textConf || 0.3)) / (emotions.length - 1);
      distribution[e] = parseFloat((vPart * videoWeight + tPart * textWeight).toFixed(4));
    });
    // 归一化
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(distribution)) {
      distribution[k] = parseFloat((distribution[k] / total).toFixed(4));
    }

    // 前端时间窗平滑
    const smoothed = smootherRef.current.update(distribution, confidenceVal);
    const finalDist = smoothed || distribution;

    // 从最终分布中提取主导情绪
    const sortedEntries = Object.entries(finalDist).sort((a, b) => b[1] - a[1]);
    const [fusedEmo, fusedConf] = sortedEntries[0];

    setFusedEmotion({ emotion: fusedEmo, confidence: fusedConf });
    setFusionDistribution(finalDist);

    // SnowNLP 模拟
    const score = fusedEmo === 'happy' || fusedEmo === 'love'
      ? parseFloat((Math.random() * 0.3 + 0.6).toFixed(4))
      : fusedEmo === 'sad' || fusedEmo === 'angry' || fusedEmo === 'anxious'
        ? parseFloat((Math.random() * 0.3 + 0.1).toFixed(4))
        : parseFloat((Math.random() * 0.2 + 0.4).toFixed(4));
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
          emotion: fusedEmo,
          confidence: fusedConf,
        },
      ];
      return newHistory.slice(-10);
    });
  }, [latestFrame, videoEmotion, transcribedText]);

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
    // 重置平滑器
    smootherRef.current.reset();
    toast('已停止监测', { icon: '⏹️' });
  }, []);

  // 监测时定时分析
  // Coze 工作流模式：每 1 秒尝试发送，但 isAnalyzingRef 防止堆积
  // 本地模式：每 2 秒分析一次
  useEffect(() => {
    if (isMonitoring && latestFrame) {
      // 立即分析一次
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
          analyzeFrame(); // isAnalyzingRef 内部防堆积
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
                  : '已连接 Coze AI 情绪分析工作流'}
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
                  {fusedEmotion && (
                    <span className="ea-stability-hint" style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: smootherRef.current.getStabilityScore() > 0.6 ? '#22c55e' : '#9CA3AF',
                    }}>
                      {smootherRef.current.getStabilityScore() > 0.6 ? '稳定' : '波动中'}
                    </span>
                  )}
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

            {serviceOnline ? (
              <>
                <div className="ea-modal-online-hint">
                  ✅ Coze 情绪分析工作流已就绪
                </div>
                <p>您可以选择连接在线服务获取 AI 情绪识别，或使用本地模拟模式体验</p>
              </>
            ) : (
              <>
                <p>情绪分析由 Coze AI 工作流提供支持，点击连接即可使用</p>
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
              {serviceOnline ? (
                <button className="ea-btn ea-btn-primary" onClick={connectOnlineService}>
                  🔗 连接 AI 服务
                </button>
              ) : (
                <button className="ea-btn ea-btn-primary" onClick={startInferenceService}>
                  🔗 连接 Coze 服务
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
            <h3>正在连接服务...</h3>
            <p>正在连接 Coze 情绪分析工作流，请稍候</p>
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
