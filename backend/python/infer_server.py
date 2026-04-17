"""
EmoSoul 情感识别 Python 推理服务
- 基于 DeepFace 的人脸情绪识别
- 基于 SnowNLP 的中文文本情感分析
- 提供健康检查、情绪分析 API

启动方式:
  python infer_server.py
  
安装依赖:
  pip install -r requirements.txt
"""

import os
import sys
import base64
import io
import logging
import traceback
import tempfile
import random
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

# ======================== 日志配置 ========================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ======================== 全局状态 ========================
# 模型是否已加载
model_loaded = False
model_error = None

# DeepFace 实例
deepface_available = False

# SnowNLP 实例
snownlp_available = False

# DeepFace 支持的情绪映射到我们的 8 分类
DEEPFACE_TO_OURS = {
    'happy': 'happy',
    'sad': 'sad',
    'angry': 'angry',
    'surprise': 'surprise',
    'fear': 'fear',
    'disgust': 'disgust',
    'neutral': 'neutral',
    'contempt': 'contempt',
}


# ======================== 模型加载 ========================
def load_models():
    """加载 DeepFace 和 SnowNLP 模型"""
    global model_loaded, model_error, deepface_available, snownlp_available

    try:
        # 尝试加载 DeepFace
        try:
            from deepface import DeepFace
            logger.info("正在预热 DeepFace 模型（首次可能需要下载权重）...")
            # 预热：用一张纯色图片触发模型加载
            try:
                import numpy as np
                dummy_img = np.zeros((48, 48, 3), dtype=np.uint8)
                dummy_path = os.path.join(tempfile.gettempdir(), 'deepface_warmup.jpg')
                import cv2
                cv2.imwrite(dummy_path, dummy_img)
                DeepFace.analyze(
                    img_path=dummy_path,
                    actions=['emotion'],
                    enforce_detection=False,
                    silent=True
                )
                try:
                    os.unlink(dummy_path)
                except:
                    pass
                logger.info("DeepFace 模型预热完成")
            except Exception as warmup_err:
                logger.warning(f"DeepFace 预热失败（不影响后续使用）: {warmup_err}")
            deepface_available = True
            logger.info("DeepFace 加载成功")
        except ImportError:
            logger.warning("DeepFace 未安装，视频情绪识别不可用。安装: pip install deepface")
            deepface_available = False
        except Exception as e:
            logger.warning(f"DeepFace 加载失败: {e}")
            deepface_available = False

        # 尝试加载 SnowNLP
        try:
            from snownlp import SnowNLP
            snownlp_available = True
            logger.info("SnowNLP 加载成功")
        except ImportError:
            logger.warning("SnowNLP 未安装，文本情感分析不可用。安装: pip install snownlp")
            snownlp_available = False

        model_loaded = True
        model_error = None
        logger.info(f"所有可用模型加载完成 (DeepFace: {deepface_available}, SnowNLP: {snownlp_available})")

    except Exception as e:
        model_error = str(e)
        logger.error(f"模型加载失败: {e}")
        # 即使部分失败也标记为已加载（允许降级运行）
        model_loaded = True


# ======================== 核心分析函数 ========================
def analyze_face_emotion(image_base64):
    """
    使用 DeepFace 分析人脸情绪
    输入: base64 编码的图片
    输出: { emotion, confidence, raw_emotions } 或 None
    """
    if not deepface_available:
        return None

    try:
        from deepface import DeepFace

        # 解码 base64 图片
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        image_bytes = base64.b64decode(image_base64)

        # 保存为临时文件（DeepFace 需要文件路径）
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            # 执行情绪分析
            result = DeepFace.analyze(
                img_path=tmp_path,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )

            # DeepFace 返回格式可能是 list 或 dict
            if isinstance(result, list) and len(result) > 0:
                result = result[0]

            if isinstance(result, dict) and 'emotion' in result:
                emotions = result['emotion']
                # 获取最高概率的情绪
                dominant = result.get('dominant_emotion', 'neutral')
                confidence = emotions.get(dominant, 0) / 100.0  # 转换为 0-1

                # 映射到我们的分类
                mapped = DEEPFACE_TO_OURS.get(dominant, 'neutral')

                logger.info(f"DeepFace 检测: {dominant} -> {mapped}, 置信度: {confidence:.2%}")

                return {
                    'emotion': mapped,
                    'confidence': round(confidence, 4),
                    'raw_emotions': emotions  # 原始分布
                }
        finally:
            # 清理临时文件
            try:
                os.unlink(tmp_path)
            except:
                pass

    except ValueError as e:
        # DeepFace 无法检测到人脸
        logger.debug(f"未检测到人脸: {e}")
    except Exception as e:
        logger.warning(f"人脸情绪分析异常: {e}")
        logger.debug(traceback.format_exc())

    return None


def analyze_text_sentiment(text):
    """
    使用 SnowNLP 分析中文文本情感
    输入: 中文文本
    输出: { score, label } 或 None
    """
    if not snownlp_available or not text:
        return None

    try:
        from snownlp import SnowNLP
        s = SnowNLP(text)
        score = s.sentiments  # 0-1，越接近1越正面

        if score > 0.6:
            label = '正面'
        elif score > 0.4:
            label = '中性'
        else:
            label = '负面'

        return {
            'score': round(score, 4),
            'label': label
        }
    except Exception as e:
        logger.warning(f"文本情感分析异常: {e}")
        return None


def build_fusion_distribution(dominant_emotion, confidence, raw_emotions=None):
    """
    构建融合后的情绪分布
    如果有 DeepFace 的原始分布，直接使用并映射
    否则基于主导情绪和置信度生成模拟分布
    """
    all_emotions = ['neutral', 'happy', 'sad', 'surprise', 'fear', 'disgust', 'angry', 'contempt']

    if raw_emotions:
        # 使用 DeepFace 返回的原始分布
        distribution = {}
        for emo in all_emotions:
            df_key = emo  # 大部分 key 一致
            if df_key in raw_emotions:
                distribution[emo] = round(raw_emotions[df_key] / 100.0, 4)
            else:
                distribution[emo] = 0.0

        # 归一化
        total = sum(distribution.values())
        if total > 0:
            distribution = {k: round(v / total, 4) for k, v in distribution.items()}
        return distribution

    # 没有原始分布，生成模拟分布（加权分配）
    distribution = {}
    remaining = 1.0 - confidence

    for i, emo in enumerate(all_emotions):
        if emo == dominant_emotion:
            distribution[emo] = round(confidence, 4)
        elif i == len(all_emotions) - 1:
            distribution[emo] = max(0, round(remaining, 4))
        else:
            val = random.random() * (remaining / 2)
            distribution[emo] = round(val, 4)
            remaining -= val

    return distribution


# ======================== API 路由 ========================

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    if model_loaded:
        return jsonify({
            'status': 'ok',
            'model_loaded': model_loaded,
            'deepface': deepface_available,
            'snownlp': snownlp_available,
            'timestamp': datetime.now().isoformat()
        })
    elif model_error:
        return jsonify({
            'status': 'error',
            'error': model_error,
            'timestamp': datetime.now().isoformat()
        }), 503
    else:
        return jsonify({
            'status': 'loading',
            'timestamp': datetime.now().isoformat()
        })


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    综合情绪分析接口
    接收: { image: base64_string, text?: string }
    返回: {
        emotion, confidence,
        audio_emotion, audio_confidence,
        transcribed_text,
        snownlp_score, snownlp_label,
        fusion_distribution
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': '请提供 JSON 数据'}), 400

        image_base64 = data.get('image', '')
        text = data.get('text', '')

        if not image_base64 and not text:
            return jsonify({'error': '请提供图像或文本数据'}), 400

        result = {
            'emotion': None,
            'confidence': 0,
            'audio_emotion': None,
            'audio_confidence': 0,
            'transcribed_text': '',
            'snownlp_score': None,
            'snownlp_label': '中性',
        }

        # 1. 视频情绪分析（DeepFace）
        raw_emotions = None
        if image_base64:
            face_result = analyze_face_emotion(image_base64)
            if face_result:
                result['emotion'] = face_result['emotion']
                result['confidence'] = face_result['confidence']
                raw_emotions = face_result.get('raw_emotions')
                logger.info(f"视频情绪: {face_result['emotion']} ({face_result['confidence']:.2%})")
            else:
                logger.debug("视频情绪分析无结果（可能未检测到人脸）")

        # 2. 文本情感分析（SnowNLP）
        if text:
            sentiment = analyze_text_sentiment(text)
            if sentiment:
                result['snownlp_score'] = sentiment['score']
                result['snownlp_label'] = sentiment['label']
                # 文本情绪映射（简单的正负面映射）
                if sentiment['score'] > 0.7:
                    result['audio_emotion'] = 'happy'
                    result['audio_confidence'] = round(sentiment['score'], 4)
                elif sentiment['score'] < 0.3:
                    result['audio_emotion'] = 'sad'
                    result['audio_confidence'] = round(1 - sentiment['score'], 4)
                else:
                    result['audio_emotion'] = 'neutral'
                    result['audio_confidence'] = 0.5

        # 3. 构建融合分布
        dominant = result['emotion'] or 'neutral'
        conf = result['confidence'] or 0.3
        result['fusion_distribution'] = build_fusion_distribution(dominant, conf, raw_emotions)

        return jsonify(result)

    except Exception as e:
        logger.error(f"分析请求处理失败: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/analyze/text', methods=['POST'])
def analyze_text():
    """纯文本情感分析接口"""
    try:
        data = request.get_json()
        text = data.get('text', '') if data else ''

        if not text:
            return jsonify({'error': '请提供文本数据'}), 400

        result = analyze_text_sentiment(text)
        if result:
            return jsonify(result)
        else:
            return jsonify({'error': '文本分析不可用'}), 503

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/shutdown', methods=['POST'])
def shutdown():
    """关闭服务接口"""
    func = request.environ.get('werkzeug.server.shutdown')
    if func is not None:
        func()
    else:
        # 强制退出
        import os
        os._exit(0)
    return jsonify({'status': 'shutting down'})


# ======================== 启动入口 ========================
if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_SERVICE_PORT', 5000))
    host = os.environ.get('PYTHON_SERVICE_HOST', '0.0.0.0')

    logger.info("=" * 50)
    logger.info("  EmoSoul 情感识别 Python 推理服务")
    logger.info(f"  监听地址: http://{host}:{port}")
    logger.info("=" * 50)

    # 先加载模型
    load_models()

    # 启动 Flask 服务
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True  # 多线程模式，支持并发请求
    )
