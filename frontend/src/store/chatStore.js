import { create } from 'zustand';
import { userApi } from '../services/userService';
import { persist } from 'zustand/middleware';

/**
 * 对话状态管理
 */
export const useChatStore = create(
    persist(
        (set, get) => ({
            // 状态
            messages: [],
            currentEmotion: 'thinking',
            isLoading: false,
            lastMessageId: null,
            isPolling: false,
            chatMode: 'normal', // 聊天模式：'normal' 或 'vip'
            /** 左侧「我的状态」，类似微信状态，与 AI 表情独立 */
            companionStatus: 'thinking',
            // 数字人个性化设置
            companionSettings: {
                companion_name: '小伴',
                companion_personality: 'warm',
                chat_style: 'friendly'
            },

            // Actions
            addMessage: (message) => {
                set((state) => ({
                    messages: [...state.messages, message],
                    lastMessageId: message.id
                }));
            },

            setMessages: (messages) => {
                set({ messages });
            },

            clearMessages: () => {
                set({
                    messages: [],
                    lastMessageId: null
                });
            },

            setEmotion: (emotion) => {
                set({ currentEmotion: emotion });
            },

            setCompanionStatus: (companionStatus) => {
                set({ companionStatus });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setPolling: (polling) => {
                set({ isPolling: polling });
            },

            setChatMode: (mode) => {
                set({ chatMode: mode });
            },

            // 加载数字人设置
            loadCompanionSettings: async () => {
                try {
                    const res = await userApi.getCompanionSettings();
                    if (res && res.data) {
                        set({ companionSettings: res.data });
                    }
                } catch (error) {
                    console.error('加载数字人设置失败:', error);
                }
            },

            // 更新数字人设置
            updateCompanionSettings: async (settings) => {
                try {
                    const res = await userApi.updateCompanionSettings(settings);
                    if (res && res.data) {
                        set({ companionSettings: res.data });
                    }
                    return res;
                } catch (error) {
                    console.error('更新数字人设置失败:', error);
                    throw error;
                }
            },

            // 更新消息（用于接收AI回复）
            updateMessageResponse: (messageId, response, emotion) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === messageId
                            ? { ...msg, response, emotion, hasResponse: true }
                            : msg
                    ),
                    currentEmotion: emotion
                }));
            }
        }),
        {
            name: 'yu-ni-xiang-ban-chat',
            partialize: (state) => ({ companionStatus: state.companionStatus })
        }
    )
);

export default useChatStore;