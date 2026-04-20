const EmotionService = require('../services/emotionService');
const axios = require('axios');

const COZE_EMOTION_URL = process.env.COZE_EMOTION_WORKFLOW_URL || '';
const COZE_EMOTION_TOKEN = process.env.COZE_EMOTION_API_TOKEN || process.env.COZE_API_TOKEN || '';

const OUR_EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'anxious', 'calm', 'thinking', 'love'];

class TemporalSmoother {
    constructor(windowSize = 5, emaAlpha = 0.4, lowConfThreshold = 0.35) {
        this.windowSize = windowSize;
        this.emaAlpha = emaAlpha;
        this.lowConfThreshold = lowConfThreshold;
        this.emaDistribution = null;
        this.lastEmotion = null;
        this.stableCount = 0;
    }

    update(distribution, confidence) {
        if (!distribution) return null;

        if (confidence < this.lowConfThreshold) {
            const decay = confidence / this.lowConfThreshold;
            const uniformVal = 1.0 / OUR_EMOTIONS.length;
            distribution = Object.fromEntries(
                OUR_EMOTIONS.map(emo => [emo, distribution[emo] * decay + uniformVal * (1 - decay)])
            );
            const total = Object.values(distribution).reduce((a, b) => a + b, 0);
            if (total > 0) {
                distribution = Object.fromEntries(
                    Object.entries(distribution).map(([k, v]) => [k, Math.round((v / total) * 10000) / 10000])
                );
            }
        }

        if (!this.emaDistribution) {
            this.emaDistribution = { ...distribution };
        } else {
            const alpha = this.emaAlpha;
            this.emaDistribution = Object.fromEntries(
                OUR_EMOTIONS.map(emo => [
                    emo,
                    Math.round((alpha * (distribution[emo] || 0) + (1 - alpha) * (this.emaDistribution[emo] || 0)) * 10000) / 10000,
                ])
            );
        }

        const total = Object.values(this.emaDistribution).reduce((a, b) => a + b, 0);
        if (total > 0) {
            this.emaDistribution = Object.fromEntries(
                Object.entries(this.emaDistribution).map(([k, v]) => [k, Math.round((v / total) * 10000) / 10000])
            );
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
    }

    getStabilityScore() {
        return Math.min(1.0, this.stableCount / this.windowSize);
    }

    reset() {
        this.emaDistribution = null;
        this.lastEmotion = null;
        this.stableCount = 0;
    }
}

const fusionSmoother = new TemporalSmoother(4, 0.5, 0.25);

function parseCozeSSEResponse(responseText) {
    const lines = responseText.split('\n');
    let finalResult = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data:')) {
            try {
                const dataStr = trimmedLine.substring(5).trim();
                if (!dataStr) continue;

                const data = JSON.parse(dataStr);

                if (data.type === 'node_end' && data.node_title === '结束') {
                    const output = data.output || '{}';
                    finalResult = typeof output === 'string' ? JSON.parse(output) : output;
                } else if (data.type === 'workflow_end') {
                    if (data.output) {
                        finalResult = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
                    }
                } else if (data.type === 'message' && data.content) {
                    try {
                        const content = JSON.parse(data.content);
                        if (content.emotion) {
                            finalResult = content;
                        }
                    } catch (e) {
                    }
                }
            } catch (e) {
            }
        }
    }

    return finalResult;
}

function extractEmotionResult(responseData) {
    let result = null;

    if (typeof responseData === 'string') {
        if (responseData.includes('event:') || responseData.includes('data:')) {
            result = parseCozeSSEResponse(responseData);
        } else {
            try {
                result = JSON.parse(responseData);
            } catch {
                const match = responseData.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) {
                    try { result = JSON.parse(match[1].trim()); } catch { }
                }
            }
        }
    } else if (typeof responseData === 'object') {
        if (responseData.code && responseData.code !== 0) {
            const errorMsg = responseData.msg || responseData.message || 'Coze API 返回错误';
            console.error('Coze 情绪分析 API 错误:', responseData.code, errorMsg);
            return null;
        }

        if (responseData.emotion && OUR_EMOTIONS.includes(responseData.emotion)) {
            result = responseData;
        } else if (responseData.analysis_result) {
            const ar = typeof responseData.analysis_result === 'string'
                ? (() => { try { return JSON.parse(responseData.analysis_result); } catch { return null; } })()
                : responseData.analysis_result;
            if (ar && ar.emotion) result = ar;
        } else if (responseData.data) {
            const data = typeof responseData.data === 'string' ? (() => {
                try { return JSON.parse(responseData.data); } catch { return null; }
            })() : responseData.data;

            if (data && data.emotion) {
                result = data;
            } else if (data && typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.emotion) result = parsed;
                } catch { }
            }
        } else if (responseData.response) {
            try {
                const parsed = typeof responseData.response === 'string'
                    ? JSON.parse(responseData.response)
                    : responseData.response;
                if (parsed.emotion) result = parsed;
            } catch { }
        }
    }

    return result;
}

function normalizeEmotionResult(result) {
    if (!result) return null;

    const emotion = OUR_EMOTIONS.includes(result.emotion) ? result.emotion : 'calm';

    const confidence = Math.max(0.1, Math.min(1.0, parseFloat(result.confidence) || 0.3));

    const intensity = Math.max(1, Math.min(5, parseInt(result.intensity) || 3));

    let distribution = result.distribution;
    if (!distribution || typeof distribution !== 'object') {
        distribution = {};
        const remaining = 1 - confidence;
        for (const emo of OUR_EMOTIONS) {
            distribution[emo] = emo === emotion
                ? Math.round(confidence * 10000) / 10000
                : Math.round((remaining / (OUR_EMOTIONS.length - 1)) * 10000) / 10000;
        }
    } else {
        const filled = {};
        for (const emo of OUR_EMOTIONS) {
            filled[emo] = parseFloat(distribution[emo]) || 0;
        }
        const total = Object.values(filled).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const emo of OUR_EMOTIONS) {
                filled[emo] = Math.round((filled[emo] / total) * 10000) / 10000;
            }
        }
        distribution = filled;
    }

    return {
        emotion,
        confidence: Math.round(confidence * 10000) / 10000,
        intensity,
        text_emotion: result.text_emotion && OUR_EMOTIONS.includes(result.text_emotion) ? result.text_emotion : null,
        text_confidence: Math.round(Math.max(0, Math.min(1, parseFloat(result.text_confidence) || 0)) * 10000) / 10000,
        image_emotion: result.image_emotion && OUR_EMOTIONS.includes(result.image_emotion) ? result.image_emotion : null,
        image_confidence: Math.round(Math.max(0, Math.min(1, parseFloat(result.image_confidence) || 0)) * 10000) / 10000,
        distribution,
        advice: result.advice || EmotionService.getEmotionAdvice(emotion, intensity),
        reasoning: result.reasoning || '',
    };
}

class EmotionAnalysisController {
    async checkHealth(ctx) {
        const hasUrl = !!COZE_EMOTION_URL;
        const hasToken = !!COZE_EMOTION_TOKEN;

        if (hasUrl && hasToken) {
            ctx.body = {
                code: 200,
                message: 'Coze 情绪分析工作流已配置',
                data: {
                    status: 'ok',
                    type: 'coze_workflow',
                    workflow_url: COZE_EMOTION_URL.replace(/\/run$/, '/***'),
                    timestamp: new Date().toISOString(),
                },
            };
        } else {
            ctx.body = {
                code: 200,
                message: 'Coze 情绪分析工作流未完整配置',
                data: {
                    status: hasUrl && hasToken ? 'ok' : 'offline',
                    missing: [
                        !hasUrl && 'COZE_EMOTION_WORKFLOW_URL',
                        !hasToken && 'COZE_EMOTION_TOKEN',
                    ].filter(Boolean),
                },
            };
        }
    }

    async startService(ctx) {
        if (COZE_EMOTION_URL && COZE_EMOTION_TOKEN) {
            ctx.body = {
                code: 200,
                message: 'Coze 情绪分析工作流已就绪，无需额外启动',
                data: { status: 'ok' },
            };
        } else {
            ctx.body = {
                code: 200,
                message: 'Coze 情绪分析工作流未配置，请检查 .env 文件',
                data: { status: 'offline' },
            };
        }
    }

    async analyzeFrame(ctx) {
        try {
            const { image, text } = ctx.request.body;

            if (!image && !text) {
                ctx.body = { code: 400, message: '请提供图像或文本数据' };
                return;
            }

            if (COZE_EMOTION_URL && COZE_EMOTION_TOKEN) {
                try {
                    const requestBody = { text: text || '' };
                    if (image) {
                        requestBody.image = { url: image, file_type: 'image' };
                    }

                    const imageLen = image ? image.length : 0;
                    const imagePrefix = image ? image.substring(0, 30) : 'N/A';
                    console.log(`[EmotionAnalysis] 调用 Coze 工作流: ${COZE_EMOTION_URL}, text=${text ? text.substring(0, 20) : '无'}, image=${imageLen > 0 ? imageLen + '字符, 前缀=' + imagePrefix + '...' : '无'}`);
                    console.log(`[EmotionAnalysis] 请求体 image 字段:`, image ? { url_length: image.length, file_type: 'image', url_prefix: image.substring(0, 50) } : '未传');

                    const response = await axios.post(
                        COZE_EMOTION_URL,
                        requestBody,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${COZE_EMOTION_TOKEN}`,
                            },
                            timeout: 30000,
                        }
                    );

                    const rawResult = extractEmotionResult(response.data);
                    const result = normalizeEmotionResult(rawResult);

                    if (result) {
                        const smoothedDist = fusionSmoother.update(result.distribution, result.confidence);
                        let finalDistribution = smoothedDist || result.distribution;
                        let finalEmotion = result.emotion;
                        let finalConfidence = result.confidence;

                        if (smoothedDist) {
                            const sorted = Object.entries(smoothedDist).sort((a, b) => b[1] - a[1]);
                            finalEmotion = sorted[0][0];
                            finalConfidence = sorted[0][1];
                        }

                        const stability = fusionSmoother.getStabilityScore();
                        if (stability > 0.6 && finalConfidence > 0.3) {
                            finalConfidence = Math.min(0.95, Math.round(finalConfidence * (1 + stability * 0.1) * 10000) / 10000);
                        }

                        finalEmotion = EmotionService.mapToValidEmotion(finalEmotion);

                        console.log(
                            `[EmotionAnalysis] Coze 结果: emotion=${finalEmotion}, ` +
                            `confidence=${(finalConfidence * 100).toFixed(1)}%, ` +
                            `text=${result.text_emotion || 'N/A'}, ` +
                            `image=${result.image_emotion || 'N/A'}, ` +
                            `stability=${(stability * 100).toFixed(0)}%`
                        );

                        ctx.body = {
                            code: 200,
                            message: '分析完成',
                            data: {
                                video_emotion: result.image_emotion ? EmotionService.mapToValidEmotion(result.image_emotion) : null,
                                video_confidence: result.image_confidence || 0,
                                video_distribution: null,
                                audio_emotion: null,
                                audio_confidence: 0,
                                text_emotion: result.text_emotion ? EmotionService.mapToValidEmotion(result.text_emotion) : null,
                                text_confidence: result.text_confidence || 0,
                                text_distribution: null,
                                fused_emotion: finalEmotion,
                                fused_confidence: finalConfidence,
                                fusion_distribution: finalDistribution,
                                stability_score: stability,
                                transcribed_text: text || '',
                                snownlp_score: null,
                                snownlp_label: '中性',
                                advice: result.advice,
                                reasoning: result.reasoning,
                            },
                        };
                        return;
                    } else {
                        console.warn('[EmotionAnalysis] Coze 工作流返回无法解析，使用本地降级');
                    }
                } catch (err) {
                    console.warn('[EmotionAnalysis] Coze 工作流调用失败，使用本地降级:', err.message);
                }
            }

            let textEmotion = null;
            let textConfidence = 0;
            let textDistribution = null;

            if (text) {
                const localResult = EmotionService.analyzeEmotion(text);
                textEmotion = localResult.emotion;
                textConfidence = localResult.confidence || (localResult.intensity / 5);
                textDistribution = localResult.distribution || null;
            }

            let fusedEmotion = textEmotion || 'calm';
            let fusedConfidence = textConfidence || 0.3;
            let fusionDistribution = textDistribution;

            if (!fusionDistribution) {
                fusionDistribution = {};
                const remaining = 1 - fusedConfidence;
                for (const emo of OUR_EMOTIONS) {
                    fusionDistribution[emo] = emo === fusedEmotion
                        ? Math.round(fusedConfidence * 10000) / 10000
                        : Math.round((remaining / (OUR_EMOTIONS.length - 1)) * 10000) / 10000;
                }
            }

            const smoothedDist = fusionSmoother.update(fusionDistribution, fusedConfidence);
            if (smoothedDist) {
                fusionDistribution = smoothedDist;
                const sorted = Object.entries(smoothedDist).sort((a, b) => b[1] - a[1]);
                fusedEmotion = sorted[0][0];
                fusedConfidence = sorted[0][1];
            }

            const stability = fusionSmoother.getStabilityScore();
            if (stability > 0.6 && fusedConfidence > 0.3) {
                fusedConfidence = Math.min(0.95, Math.round(fusedConfidence * (1 + stability * 0.1) * 10000) / 10000);
            }

            fusedEmotion = EmotionService.mapToValidEmotion(fusedEmotion);

            ctx.body = {
                code: 200,
                message: '分析完成（本地降级）',
                data: {
                    video_emotion: null,
                    video_confidence: 0,
                    video_distribution: null,
                    audio_emotion: null,
                    audio_confidence: 0,
                    text_emotion: textEmotion ? EmotionService.mapToValidEmotion(textEmotion) : null,
                    text_confidence: textConfidence,
                    text_distribution: textDistribution,
                    fused_emotion: fusedEmotion,
                    fused_confidence: fusedConfidence || 0,
                    fusion_distribution: fusionDistribution,
                    stability_score: stability || 0,
                    transcribed_text: text || '',
                    snownlp_score: null,
                    snownlp_label: '中性',
                },
            };
        } catch (error) {
            console.error('[EmotionAnalysis] 分析失败:', error.message);
            ctx.body = {
                code: 500,
                message: '情绪分析失败: ' + error.message,
            };
        }
    }

    async getHistory(ctx) {
        ctx.body = {
            code: 200,
            message: '获取成功',
            data: [],
        };
    }
}

module.exports = new EmotionAnalysisController();
