export const CHAT_MODES = {
    normal: {
        id: 'normal',
        name: '日常陪伴',
        icon: '💬',
        description: '情感陪伴对话',
        color: '#667eea',
        placeholder: '和我聊聊天吧...'
    },
    creative: {
        id: 'creative',
        name: '内容创作',
        icon: '✍️',
        description: '故事、诗歌、创意写作',
        color: '#f093fb',
        placeholder: '写一首关于春天的诗...'
    },
    leisure: {
        id: 'leisure',
        name: '休闲互动',
        icon: '🎮',
        description: '文字游戏、话题讨论、音乐推荐',
        color: '#a855f7',
        placeholder: '来玩成语接龙吧...'
    },
    learning: {
        id: 'learning',
        name: '知识学习',
        icon: '📚',
        description: '学科辅导、语言学习、技能培训',
        color: '#6366f1',
        placeholder: '请教一个学习问题...'
    },
    thinking: {
        id: 'thinking',
        name: '思维训练',
        icon: '🧠',
        description: '逻辑思维、创意激发、决策辅助',
        color: '#64748b',
        placeholder: '给我一个思维挑战...'
    },
    psychology: {
        id: 'psychology',
        name: '心理疏导',
        icon: '🫂',
        description: '情绪倾诉、心理支持、减压建议',
        color: '#ec4899',
        placeholder: '我想聊聊最近的心情...'
    },
    explore: {
        id: 'explore',
        name: '自我探索',
        icon: '🔮',
        description: '人格测试、价值观探索、目标设定',
        color: '#10b981',
        placeholder: '帮我做个性格测试...'
    }
};

export const CHAT_MODE_LIST = Object.values(CHAT_MODES);

export default CHAT_MODES;
