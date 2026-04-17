const EmotionService = require('../services/emotionService');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Python 推理服务地址
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

// Python 子进程引用
let pythonProcess = null;

// 查找可用的 Python 命令
function findPythonCommand() {
  const commands = ['python', 'python3', 'py', 'py -3'];
  // Windows 下常见的 Python 路径
  const { execSync } = require('child_process');
  for (const cmd of commands) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore', timeout: 5000, windowsHide: true });
      return cmd;
    } catch {
      // 尝试下一个
    }
  }
  return null;
}

class EmotionAnalysisController {
  /**
   * 检查 Python 推理服务健康状态
   */
  async checkHealth(ctx) {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 3000 });
      ctx.body = {
        code: 200,
        message: 'Python 推理服务运行正常',
        data: response.data,
      };
    } catch (error) {
      ctx.body = {
        code: 200,
        message: 'Python 推理服务未启动',
        data: { status: 'offline' },
      };
    }
  }

  /**
   * 启动 Python 推理服务
   */
  async startService(ctx) {
    try {
      // 先检查是否已经在运行
      try {
        const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 2000 });
        if (response.data?.status === 'ok') {
          ctx.body = {
            code: 200,
            message: 'Python 推理服务已在运行中',
            data: { status: 'ok' },
          };
          return;
        }
      } catch {
        // 服务未运行，继续启动
      }

      // 查找可用的 Python 命令
      const pythonCmd = findPythonCommand();
      if (!pythonCmd) {
        ctx.body = {
          code: 500,
          message: '未找到 Python 环境，请安装 Python 3.8+ 并安装依赖: pip install -r requirements.txt',
        };
        return;
      }

      const inferScript = path.join(__dirname, '../../python/infer_server.py');
      console.log(`[EmotionAnalysis] 使用 ${pythonCmd} 启动推理服务: ${inferScript}`);

      // 使用 spawn 启动 Python 进程（支持实时输出日志）
      const args = pythonCmd.includes(' ') ? pythonCmd.split(' ') : [pythonCmd];
      pythonProcess = spawn(args[0], [...args.slice(1), inferScript], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: false,
      });

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python] ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python] ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`[Python] 推理服务退出，代码: ${code}`);
        pythonProcess = null;
      });

      pythonProcess.on('error', (error) => {
        console.error('[Python] 启动失败:', error.message);
        pythonProcess = null;
      });

      ctx.body = {
        code: 200,
        message: '正在启动 Python 推理服务',
        data: { status: 'starting' },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        message: '服务启动失败: ' + error.message,
      };
    }
  }

  /**
   * 分析视频帧情绪
   */
  async analyzeFrame(ctx) {
    try {
      const { image, text } = ctx.request.body;

      if (!image && !text) {
        ctx.body = { code: 400, message: '请提供图像或文本数据' };
        return;
      }

      let videoEmotion = null;
      let videoConfidence = 0;
      let audioEmotion = null;
      let audioConfidence = 0;
      let textEmotion = null;
      let textConfidence = 0;
      let transcribedText = '';
      let snownlpScore = null;
      let snownlpLabel = '中性';

      // Python 推理服务返回的原始分布（如果有的话）
      let pythonFusionDistribution = null;

      // 尝试调用 Python 推理服务进行视频情绪分析
      if (image) {
        try {
          const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, {
            image: image,
          }, { timeout: 15000 });

          if (response.data) {
            videoEmotion = response.data.emotion || null;
            videoConfidence = response.data.confidence || 0;
            audioEmotion = response.data.audio_emotion || null;
            audioConfidence = response.data.audio_confidence || 0;
            transcribedText = response.data.transcribed_text || '';
            snownlpScore = response.data.snownlp_score || null;
            snownlpLabel = response.data.snownlp_label || '中性';
            // 优先使用 Python 返回的融合分布
            pythonFusionDistribution = response.data.fusion_distribution || null;
          }
        } catch (err) {
          console.warn('Python 推理服务不可用，使用本地分析:', err.message);
        }
      }

      // 本地文本情绪分析
      if (text) {
        const localResult = EmotionService.analyzeEmotion(text);
        textEmotion = localResult.emotion;
        textConfidence = localResult.intensity / 5;
      }

      // 融合情绪（优先使用视频结果，其次文本）
      let fusedEmotion = videoEmotion || textEmotion || 'neutral';
      let fusedConfidence = videoConfidence || textConfidence || 0;

      // 如果都有结果，进行加权融合
      if (videoEmotion && textEmotion) {
        const videoWeight = 0.6;
        const textWeight = 0.4;
        fusedConfidence = videoConfidence * videoWeight + textConfidence * textWeight;

        // 如果视频和文本情绪不一致，取置信度更高的
        if (videoEmotion !== textEmotion) {
          fusedEmotion = videoConfidence >= textConfidence ? videoEmotion : textEmotion;
        }
      }

      // 融合分布：优先使用 Python 返回的分布，否则本地生成
      let fusionDistribution;
      if (pythonFusionDistribution && Object.keys(pythonFusionDistribution).length > 0) {
        fusionDistribution = pythonFusionDistribution;
      } else {
        fusionDistribution = {
          neutral: fusedEmotion === 'neutral' ? fusedConfidence : (1 - fusedConfidence) * 0.4,
          happy: fusedEmotion === 'happy' ? fusedConfidence : (1 - fusedConfidence) * 0.15,
          sad: fusedEmotion === 'sad' ? fusedConfidence : (1 - fusedConfidence) * 0.1,
          surprise: fusedEmotion === 'surprise' ? fusedConfidence : (1 - fusedConfidence) * 0.1,
          fear: fusedEmotion === 'fear' ? fusedConfidence : (1 - fusedConfidence) * 0.08,
          disgust: fusedEmotion === 'disgust' ? fusedConfidence : (1 - fusedConfidence) * 0.05,
          angry: fusedEmotion === 'angry' ? fusedConfidence : (1 - fusedConfidence) * 0.07,
          contempt: fusedEmotion === 'contempt' ? fusedConfidence : (1 - fusedConfidence) * 0.05,
        };
      }

      ctx.body = {
        code: 200,
        message: '分析完成',
        data: {
          video_emotion: videoEmotion,
          video_confidence: videoConfidence,
          audio_emotion: audioEmotion,
          audio_confidence: audioConfidence,
          text_emotion: textEmotion,
          text_confidence: textConfidence,
          fused_emotion: fusedEmotion,
          fused_confidence: fusedConfidence,
          fusion_distribution: fusionDistribution,
          transcribed_text: transcribedText,
          snownlp_score: snownlpScore,
          snownlp_label: snownlpLabel,
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        message: '情绪分析失败: ' + error.message,
      };
    }
  }

  /**
   * 获取情绪分析历史
   */
  async getHistory(ctx) {
    // 暂时返回空数据，后续可对接数据库
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: [],
    };
  }
}

module.exports = new EmotionAnalysisController();
