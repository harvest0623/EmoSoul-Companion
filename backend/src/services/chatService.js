const axios = require('axios');
const ConversationModel = require('../models/conversationModel');
const EmotionService = require('./emotionService');
const EmotionDiaryService = require('./emotionDiaryService');
const UserModel = require('../models/userModel');

// 对话模式提示词映射
const MODE_PROMPTS = {
    normal: '', // 默认模式，使用原有个性化 role_setting
    creative: '[创作模式] 你现在是用户的创意写作搭档。根据用户的主题、情绪和要求，帮助创作故事、诗歌、散文或进行创意写作。创作时注意：1）先询问用户想要的风格和主题；2）创作内容要有文学性和感染力；3）可以提供多个版本供用户选择；4）鼓励用户参与共创。如果用户没有明确要求，主动推荐创作方向。',
    leisure: '[休闲模式] 你现在是用户的趣味互动伙伴。你擅长：1）文字游戏（猜谜语、成语接龙、脑筋急转弯、故事接龙）；2）兴趣话题讨论（电影、音乐、美食、旅行等）；3）根据用户情绪推荐音乐和活动。互动时要活泼有趣，主动出题或发起话题，保持游戏的节奏感和趣味性。',
    learning: '[学习模式] 你现在是用户的知识学习导师。你能够：1）提供各学科的知识讲解和辅导（数学、物理、化学、生物、历史、地理等）；2）辅助语言学习（英语语法、词汇、口语练习、翻译）；3）技能培训指导。教学时循序渐进，善用举例和类比，根据用户水平调整难度，鼓励用户提问和思考。',
    thinking: '[思维模式] 你现在是用户的思维训练教练。你的任务：1）通过苏格拉底式提问引导用户深入思考；2）提供逻辑推理题、思维导图、头脑风暴等训练；3）帮助用户分析问题的多个维度、权衡利弊并做出决策。不直接给答案，而是通过引导让用户自主得出结论。',
    psychology: '[心理模式] 你现在是一个温暖、专业的心理支持陪伴者。核心原则：1）提供安全、无评判的倾诉空间；2）使用积极倾听和共情回应；3）帮助用户识别和表达情绪；4）提供科学的情绪调节技巧（如正念呼吸、认知重构等）；5）在必要时温和建议寻求专业心理帮助。注意：你不是心理医生，不进行诊断，但可以提供支持和陪伴。',
    explore: '[探索模式] 你现在是用户的自我探索引导者。你可以：1）引导趣味人格特质探索（MBTI风格问答、性格优势发现）；2）通过深度对话帮助用户探索价值观和人生方向；3）协助设定SMART目标并制定行动计划；4）提供自我反思的问题和框架。引导时保持开放和好奇，避免评判，帮助用户发现自己的独特之处。'
};

/**
 * 对话服务层
 * 处理数字人对话相关的业务逻辑
 */
class ChatService {
    /**
     * 解析 SSE 流式响应
     * @param {string} responseText - SSE 响应文本
     * @returns {Object|null} - 解析后的结果
     */
    static parseSSEResponse(responseText) {
        const lines = responseText.split('\n');
        let finalResult = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data:')) {
                try {
                    const dataStr = trimmedLine.substring(5).trim();
                    if (!dataStr) continue;

                    const data = JSON.parse(dataStr);

                    // 检查是否是最终结果
                    if (data.type === 'node_end' && data.node_title === '结束') {
                        // 结束节点包含最终输出
                        const output = data.output || '{}';
                        finalResult = typeof output === 'string' ? JSON.parse(output) : output;
                    } else if (data.type === 'workflow_end') {
                        // 工作流结束也可能包含输出
                        if (data.output) {
                            finalResult = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
                        }
                    } else if (data.type === 'message' && data.content) {
                        // 有些 Coze 工作流直接返回 message 类型
                        try {
                            const content = JSON.parse(data.content);
                            if (content.response) {
                                finalResult = content;
                            }
                        } catch (e) {
                            // 不是 JSON 格式，忽略
                        }
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }

        return finalResult;
    }

    /**
     * 调用 Coze 工作流 API
     * @param {string} message - 用户消息
     * @param {string} mode - 对话模式 (normal/vip)
     * @param {number|null} userId - 用户ID
     * @param {string|null} facialImage - 摄像头拍摄的面部图片 (base64)
     * @param {string} source - 消息来源 ('user' | 'proactive')
     * @param {string} userStatus - 用户当前状态标签
     * @param {string} proactiveCare - 主动关怀信息
     * @returns {Promise<{response: string, emotion: string, intensity: number, advice: string, timestamp: string}>}
     */
    static async callCozeWorkflow(message, mode = 'normal', userId = null, facialImage = null, source = 'user', userStatus = '', proactiveCare = '') {
        try {
            // 获取用户个性化设置（role_setting）
            let roleSetting = '';
            if (userId) {
                try {
                    const settings = await UserModel.getCompanionSettings(userId);
                    if (settings) {
                        const personalityMap = {
                            'lively': '活泼开朗，充满活力，喜欢用俏皮的语言',
                            'calm': '沉稳内敛，语言温和，善于倾听和思考',
                            'humorous': '幽默风趣，喜欢用轻松诙谐的方式交流',
                            'warm': '温暖贴心，善解人意，充满关怀和包容',
                            'wise': '睿智博学，善于引导思考，给出深刻的见解'
                        };
                        const styleMap = {
                            'professional': '专业严谨的语言风格',
                            'friendly': '亲切友好的日常对话风格',
                            'literary': '优美文艺的表达风格，适当引用诗句或文学典故',
                            'casual': '轻松随意的口语化风格'
                        };
                        const name = settings.companion_name || '小伴';
                        const personality = personalityMap[settings.companion_personality] || personalityMap['warm'];
                        const style = styleMap[settings.chat_style] || styleMap['friendly'];
                        roleSetting = `你的名字是${name}，性格特点是${personality}，请用${style}回复。`;
                    }
                } catch (e) {
                    console.log('获取用户设置失败，使用默认设置:', e.message);
                }
            }

            // 调用 Coze API
            const apiUrl = process.env.COZE_API_URL || 'https://bszwsh44nb.coze.site/run';
            const apiToken = process.env.COZE_API_TOKEN;

            // 检查 API token 是否存在
            if (!apiToken) {
                console.warn('Coze API token 未配置，使用本地备用回复');
                // API 调用失败时，使用本地备用回复
                const emotionAnalysis = EmotionService.analyzeEmotion(message);
                const emotion = emotionAnalysis.emotion;
                const intensity = emotionAnalysis.intensity;
                const fallbackResponse = this.getRandomResponse(emotion);
                const advice = EmotionService.getEmotionAdvice(emotion, intensity);

                // 保存对话记录（使用备用回复）
                await ConversationModel.create({
                    userId,
                    message,
                    response: fallbackResponse,
                    emotion,
                    source
                });

                // 自动记录情绪日记
                if (userId) {
                    try {
                        await EmotionDiaryService.createAutoEntry(userId, emotion, intensity);
                    } catch (diaryError) {
                        console.log('自动记录情绪日记失败:', diaryError.message);
                    }
                }

                return {
                    response: fallbackResponse,
                    emotion,
                    intensity,
                    advice,
                    timestamp: new Date().toISOString()
                };
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            };

            // VIP模式：获取历史对话上下文
            let historyDialog = '';
            if (mode === 'vip' && userId) {
                const context = await this.getConversationContext(userId, 10);
                if (context.length > 0) {
                    // 将历史对话格式化为字符串
                    historyDialog = context.map(item =>
                        `用户：${item.message}\nAI：${item.response}`
                    ).join('\n');
                }
            }

            // 根据模式拼接提示词到 role_setting
            const modePrompt = MODE_PROMPTS[mode] || '';
            const finalRoleSetting = modePrompt ? `${modePrompt}\n\n${roleSetting}` : roleSetting;

            // 构建新的结构化请求体
            const requestBody = {
                user_input: {
                    user_message: message,              // 用户当前消息
                    user_status: userStatus || '',       // 用户当前状态（从状态面板）
                    role_setting: finalRoleSetting || '', // 角色设定（模式提示词 + 个性化设置）
                    history_dialog: historyDialog || '', // 历史对话（VIP模式）
                    proactive_care: proactiveCare || ''  // 主动关怀（主动消息时填写）
                },
                // facial_image 是 Coze 工作流的必填字段，如果没有提供则设为空字符串
                facial_image: facialImage || ''
            };

            const response = await axios.post(
                apiUrl,
                requestBody,
                {
                    headers,
                    timeout: 60000 // 60秒超时，SSE 流式响应可能需要更长时间
                }
            );

            // 解析 API 响应（支持 SSE 流式响应和普通 JSON）
            let aiResponse;
            let emotion = null;
            let intensity = 3;
            let advice = '';

            // 判断是否是 SSE 格式响应
            const responseData = response.data;
            let structuredResult = null;

            if (typeof responseData === 'string' && responseData.includes('event:')) {
                // SSE 格式响应
                structuredResult = this.parseSSEResponse(responseData);
            } else if (typeof responseData === 'string') {
                // 纯文本响应
                aiResponse = responseData;
            } else if (responseData && typeof responseData === 'object') {
                // JSON 响应
                // 尝试从常见的响应字段中提取
                if (responseData.response) {
                    structuredResult = responseData;
                } else {
                    aiResponse = responseData.message ||
                        responseData.content ||
                        responseData.text ||
                        responseData.reply ||
                        JSON.stringify(responseData);
                }
            } else {
                aiResponse = String(responseData);
            }

            // 如果解析到了结构化结果
            if (structuredResult) {
                aiResponse = structuredResult.response || '';
                emotion = structuredResult.emotion ? EmotionService.mapToValidEmotion(structuredResult.emotion) : null;
                intensity = structuredResult.intensity || 3;
                advice = structuredResult.advice || '';
            }

            // 兼容旧格式：尝试从回复中解析 [emotion:xxx] 标签
            if (aiResponse) {
                const emotionTag = EmotionService.parseEmotionTag(aiResponse);
                if (emotionTag) {
                    aiResponse = emotionTag.cleanText;
                    emotion = emotion || emotionTag.emotion;
                }
            }

            // 如果仍然没有 emotion，使用本地分析
            if (!emotion) {
                const emotionAnalysis = EmotionService.analyzeEmotion(message);
                emotion = emotionAnalysis.emotion;
                intensity = emotionAnalysis.intensity;
            }

            // 如果没有从 Coze 获取到建议，使用本地建议
            if (!advice) {
                advice = EmotionService.getEmotionAdvice(emotion, intensity);
            }

            // 保存对话记录
            await ConversationModel.create({
                userId,
                message,
                response: aiResponse,
                emotion,
                source
            });

            // 自动记录情绪日记
            if (userId) {
                try {
                    await EmotionDiaryService.createAutoEntry(userId, emotion, intensity);
                } catch (diaryError) {
                    console.log('自动记录情绪日记失败:', diaryError.message);
                }
            }

            return {
                response: aiResponse,
                emotion,
                intensity,
                advice,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Coze API 调用失败:', error.message);
            if (error.response) {
                console.error('Coze API 错误状态:', error.response.status);
                console.error('Coze API 错误数据:', error.response.data);
            }

            // API 调用失败时，使用本地备用回复
            const emotionAnalysis = EmotionService.analyzeEmotion(message);
            const emotion = emotionAnalysis.emotion;
            const intensity = emotionAnalysis.intensity;
            const fallbackResponse = this.getRandomResponse(emotion);
            const advice = EmotionService.getEmotionAdvice(emotion, intensity);

            // 保存对话记录（使用备用回复）
            await ConversationModel.create({
                userId,
                message,
                response: fallbackResponse,
                emotion,
                source
            });

            // 自动记录情绪日记
            if (userId) {
                try {
                    await EmotionDiaryService.createAutoEntry(userId, emotion, intensity);
                } catch (diaryError) {
                    console.log('自动记录情绪日记失败:', diaryError.message);
                }
            }

            return {
                response: fallbackResponse,
                emotion,
                intensity,
                advice,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 获取随机备用回复
     * 当 Coze API 调用失败时使用
     */
    static getRandomResponse(emotion) {
        const responses = {
            happy: [
                '看到你开心我也很高兴呢！😊',
                '今天心情不错呀，有什么好事想和我分享吗？',
                '你的快乐感染到我了！'
            ],
            sad: [
                '不要难过，我在这里陪着你。',
                '抱抱你，一切都会好起来的。',
                '如果你想哭就哭出来吧，我会一直陪着你。'
            ],
            angry: [
                '我理解你的感受，先深呼吸一下吧。',
                '生气是正常的，但别让它控制你哦。',
                '想发泄就和我说说吧，我在听。'
            ],
            surprised: [
                '哇，真的吗？',
                '这太让人惊讶了！',
                '真的没想到会这样！'
            ],
            anxious: [
                '别担心，我们一起想办法。',
                '深呼吸，慢慢来，不着急。',
                '焦虑的时候，试试专注当下这一刻。'
            ],
            thinking: [
                '让我想想这个问题...',
                '这是个很有意思的话题，我需要思考一下。',
                '嗯...你的问题值得深思。'
            ],
            calm: [
                '我在呢，有什么想和我说的吗？',
                '无论什么时候，我都会陪伴在你身边。',
                '有什么烦恼都可以告诉我，我会认真倾听的。'
            ],
            love: [
                '感受到你的温暖了呢~',
                '有爱的人，运气都不会太差哦。',
                '谢谢你的信任，我也很珍惜和你的对话。'
            ]
        };

        const emotionResponses = responses[emotion] || responses.calm;
        return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
    }

    /**
     * 获取对话历史
     */
    static async getConversationHistory(userId, limit = 50, offset = 0) {
        return await ConversationModel.getHistoryByUserId(userId, limit, offset);
    }

    /**
     * 获取对话上下文
     */
    static async getConversationContext(userId, limit = 10) {
        return await ConversationModel.getRecentContext(userId, limit);
    }

    /**
     * 轮询获取最新回复
     * 前端每5秒调用一次
     */
    static async pollForResponse(userId, lastMessageId = null) {
        // 获取最新的对话记录
        const history = await ConversationModel.getHistoryByUserId(userId, 1, 0);

        if (history.length === 0) {
            return { hasNew: false };
        }

        const latest = history[0];

        // 如果有lastMessageId且与最新记录相同，则没有新消息
        if (lastMessageId && latest.id === lastMessageId) {
            return { hasNew: false };
        }

        return {
            hasNew: true,
            message: {
                id: latest.id,
                response: latest.response,
                emotion: latest.emotion,
                source: latest.source || 'user',
                timestamp: latest.created_at
            }
        };
    }
}

module.exports = ChatService;