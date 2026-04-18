import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import './ContentCreation.css';

/**
 * 内容创作页面
 */
const ContentCreation = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();

    const [activeTab, setActiveTab] = useState('story');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [history, setHistory] = useState([]);

    // 故事生成表单
    const [storyForm, setStoryForm] = useState({
        title: '',
        genre: 'fantasy',
        length: 'medium',
        setting: '',
        characters: ''
    });

    // 诗歌生成表单
    const [poetryForm, setPoetryForm] = useState({
        theme: '',
        style: 'modern',
        mood: 'inspirational',
        length: 'medium'
    });

    // 创意写作表单
    const [creativeForm, setCreativeForm] = useState({
        prompt: '',
        style: 'narrative',
        audience: 'general',
        length: 'medium'
    });

    // 加载历史记录
    useEffect(() => {
        const savedHistory = localStorage.getItem('contentHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    // 保存历史记录
    useEffect(() => {
        localStorage.setItem('contentHistory', JSON.stringify(history));
    }, [history]);

    // 生成故事
    const generateStory = async () => {
        if (!storyForm.title) {
            toast.error('请输入故事标题');
            return;
        }

        setIsLoading(true);

        // 模拟生成过程
        setTimeout(() => {
            const story = `# ${storyForm.title}\n\n在一个遥远的${storyForm.setting || '魔法王国'}，住着一位名叫${storyForm.characters || '艾莉亚'}的勇敢少年。\n\n${storyForm.genre === 'fantasy' ? '魔法的力量在这个世界中流淌，每一片树叶都蕴含着神秘的能量。' : ''}${storyForm.genre === 'sci-fi' ? '高科技的城市中，人工智能与人类和谐共处，创造着前所未有的奇迹。' : ''}${storyForm.genre === 'adventure' ? '冒险的召唤从未停止，每一次日出都意味着新的旅程。' : ''}\n\n有一天，${storyForm.characters || '艾莉亚'}发现了一个古老的宝藏地图，上面标记着传说中失落已久的${storyForm.genre === 'fantasy' ? '魔法宝石' : storyForm.genre === 'sci-fi' ? '能源核心' : '黄金城'}的位置。\n\n于是，一段精彩的冒险开始了...\n\n经过重重困难和挑战，${storyForm.characters || '艾莉亚'}终于找到了传说中的宝藏。但真正的宝藏不是金银财宝，而是这段旅程中收获的友谊和成长。\n\n从此，${storyForm.characters || '艾莉亚'}的故事被人们传颂，成为了永恒的传说。`;

            setResult(story);
            addToHistory('story', storyForm.title, story);
            setIsLoading(false);
            toast.success('故事生成成功！');
        }, 1500);
    };

    // 生成诗歌
    const generatePoetry = async () => {
        if (!poetryForm.theme) {
            toast.error('请输入诗歌主题');
            return;
        }

        setIsLoading(true);

        // 模拟生成过程
        setTimeout(() => {
            const poetry = `# ${poetryForm.theme}\n\n${poetryForm.mood === 'inspirational' ? '当阳光穿过云层，\n希望在心中绽放，\n每一步都通向远方，\n梦想在前方闪闪发光。' : ''}${poetryForm.mood === 'romantic' ? '月光如水，\n温柔地洒在你我的身上，\n心跳与星光共鸣，\n爱情在夜空中绽放。' : ''}${poetryForm.mood === 'melancholy' ? '秋叶飘落，\n思绪如风中的花瓣，\n回忆在时光中沉淀，\n淡淡的忧伤在心中流淌。' : ''}\n\n${poetryForm.style === 'modern' ? '生活是一首未完成的诗，\n每一个瞬间都是新的韵脚，\n我们用热情书写，\n用希望编织。' : ''}${poetryForm.style === 'classical' ? '山高水长，\n天地为卷，\n以心为笔，\n书写人间真情。' : ''}${poetryForm.style === 'free' ? '自由的灵魂在天空翱翔，\n无拘无束，\n像风一样，\n像云一样。' : ''}\n\n${poetryForm.theme}，\n你是灵感的源泉，\n是生命的赞歌，\n是永恒的美丽。`;

            setResult(poetry);
            addToHistory('poetry', poetryForm.theme, poetry);
            setIsLoading(false);
            toast.success('诗歌生成成功！');
        }, 1500);
    };

    // 生成创意写作
    const generateCreative = async () => {
        if (!creativeForm.prompt) {
            toast.error('请输入创意提示');
            return;
        }

        setIsLoading(true);

        // 模拟生成过程
        setTimeout(() => {
            const creative = `# ${creativeForm.prompt}\n\n${creativeForm.style === 'narrative' ? '这是一个关于勇气与希望的故事。在一个平凡的小镇上，住着一位不平凡的人。他/她每天都在努力着，为了自己的梦想，为了心中的信念。' : ''}${creativeForm.style === 'descriptive' ? '阳光透过树叶的缝隙，在地面上形成斑驳的光影。微风拂过，带来了远处花朵的芬芳。这是一个宁静而美好的午后，时间仿佛在此刻静止。' : ''}${creativeForm.style === 'persuasive' ? '我们每个人都有改变世界的能力。不要小看自己的力量，每一个小小的善举，都可能在某个地方产生巨大的影响。让我们一起行动起来，让世界变得更美好。' : ''}\n\n${creativeForm.audience === 'children' ? '故事的主人公是一个充满好奇心的孩子，他/她总是喜欢探索周围的世界，发现各种奇妙的事物。' : ''}${creativeForm.audience === 'adults' ? '这是一个写给成年人的故事，关于成长、关于责任、关于生活的意义。' : ''}${creativeForm.audience === 'general' ? '这个故事适合所有年龄段的读者，因为它讲述的是人类共通的情感和经历。' : ''}\n\n创意是无限的，就像宇宙中的星星一样繁多。只要我们保持想象力，保持对生活的热爱，就能够创造出无限可能。`;

            setResult(creative);
            addToHistory('creative', creativeForm.prompt, creative);
            setIsLoading(false);
            toast.success('创意写作生成成功！');
        }, 1500);
    };

    // 添加到历史记录
    const addToHistory = (type, title, content) => {
        const newHistory = [
            {
                id: Date.now(),
                type,
                title,
                content,
                timestamp: new Date().toISOString()
            },
            ...history
        ];
        setHistory(newHistory.slice(0, 10)); // 只保留最近10条
    };

    // 渲染故事生成表单
    const renderStoryForm = () => (
        <div className="content-form">
            <div className="content-form-group">
                <label className="content-form-label">故事标题</label>
                <input
                    type="text"
                    className="content-form-input"
                    placeholder="输入故事标题"
                    value={storyForm.title}
                    onChange={e => setStoryForm(prev => ({ ...prev, title: e.target.value }))}
                />
            </div>

            <div className="content-form-group">
                <label className="content-form-label">故事类型</label>
                <select
                    className="content-form-select"
                    value={storyForm.genre}
                    onChange={e => setStoryForm(prev => ({ ...prev, genre: e.target.value }))}
                >
                    <option value="fantasy">奇幻</option>
                    <option value="sci-fi">科幻</option>
                    <option value="adventure">冒险</option>
                    <option value="mystery">悬疑</option>
                    <option value="romance">爱情</option>
                </select>
            </div>

            <div className="content-form-group">
                <label className="content-form-label">故事长度</label>
                <select
                    className="content-form-select"
                    value={storyForm.length}
                    onChange={e => setStoryForm(prev => ({ ...prev, length: e.target.value }))}
                >
                    <option value="short">短篇</option>
                    <option value="medium">中篇</option>
                    <option value="long">长篇</option>
                </select>
            </div>

            <div className="content-form-group">
                <label className="content-form-label">故事背景</label>
                <input
                    type="text"
                    className="content-form-input"
                    placeholder="例如：魔法王国、未来城市等"
                    value={storyForm.setting}
                    onChange={e => setStoryForm(prev => ({ ...prev, setting: e.target.value }))}
                />
            </div>

            <div className="content-form-group">
                <label className="content-form-label">主要角色</label>
                <input
                    type="text"
                    className="content-form-input"
                    placeholder="例如：勇敢的骑士、聪明的科学家等"
                    value={storyForm.characters}
                    onChange={e => setStoryForm(prev => ({ ...prev, characters: e.target.value }))}
                />
            </div>

            <button
                className="content-btn content-btn-primary"
                onClick={generateStory}
                disabled={isLoading}
            >
                {isLoading ? '生成中...' : '生成故事'}
            </button>
        </div>
    );

    // 渲染诗歌生成表单
    const renderPoetryForm = () => (
        <div className="content-form">
            <div className="content-form-group">
                <label className="content-form-label">诗歌主题</label>
                <input
                    type="text"
                    className="content-form-input"
                    placeholder="输入诗歌主题"
                    value={poetryForm.theme}
                    onChange={e => setPoetryForm(prev => ({ ...prev, theme: e.target.value }))}
                />
            </div>

            <div className="content-form-group">
                <label className="content-form-label">诗歌风格</label>
                <select
                    className="content-form-select"
                    value={poetryForm.style}
                    onChange={e => setPoetryForm(prev => ({ ...prev, style: e.target.value }))}
                >
                    <option value="modern">现代诗</option>
                    <option value="classical">古典诗</option>
                    <option value="free">自由诗</option>
                    <option value="haiku">俳句</option>
                </select>
            </div>

            <div className="content-form-group">
                <label className="content-form-label">诗歌情感</label>
                <select
                    className="content-form-select"
                    value={poetryForm.mood}
                    onChange={e => setPoetryForm(prev => ({ ...prev, mood: e.target.value }))}
                >
                    <option value="inspirational">励志</option>
                    <option value="romantic">浪漫</option>
                    <option value="melancholy">忧郁</option>
                    <option value="joyful">欢乐</option>
                </select>
            </div>

            <div className="content-form-group">
                <label className="content-form-label">诗歌长度</label>
                <select
                    className="content-form-select"
                    value={poetryForm.length}
                    onChange={e => setPoetryForm(prev => ({ ...prev, length: e.target.value }))}
                >
                    <option value="short">短诗</option>
                    <option value="medium">中等</option>
                    <option value="long">长诗</option>
                </select>
            </div>

            <button
                className="content-btn content-btn-primary"
                onClick={generatePoetry}
                disabled={isLoading}
            >
                {isLoading ? '生成中...' : '生成诗歌'}
            </button>
        </div>
    );

    // 渲染创意写作表单
    const renderCreativeForm = () => (
        <div className="content-form">
            <div className="content-form-group">
                <label className="content-form-label">创意提示</label>
                <textarea
                    className="content-form-textarea"
                    placeholder="输入创意提示，例如：未来世界的一天、一次奇妙的旅行等"
                    value={creativeForm.prompt}
                    onChange={e => setCreativeForm(prev => ({ ...prev, prompt: e.target.value }))}
                />
            </div>

            <div className="content-form-group">
                <label className="content-form-label">写作风格</label>
                <select
                    className="content-form-select"
                    value={creativeForm.style}
                    onChange={e => setCreativeForm(prev => ({ ...prev, style: e.target.value }))}
                >
                    <option value="narrative">叙事</option>
                    <option value="descriptive">描写</option>
                    <option value="persuasive">说服</option>
                    <option value="expository">说明</option>
                </select>
            </div>

            <div className="content-form-group">
                <label className="content-form-label">目标受众</label>
                <select
                    className="content-form-select"
                    value={creativeForm.audience}
                    onChange={e => setCreativeForm(prev => ({ ...prev, audience: e.target.value }))}
                >
                    <option value="general">通用</option>
                    <option value="children">儿童</option>
                    <option value="adults">成人</option>
                    <option value="teenagers">青少年</option>
                </select>
            </div>

            <div className="content-form-group">
                <label className="content-form-label">内容长度</label>
                <select
                    className="content-form-select"
                    value={creativeForm.length}
                    onChange={e => setCreativeForm(prev => ({ ...prev, length: e.target.value }))}
                >
                    <option value="short">简短</option>
                    <option value="medium">中等</option>
                    <option value="long">详细</option>
                </select>
            </div>

            <button
                className="content-btn content-btn-primary"
                onClick={generateCreative}
                disabled={isLoading}
            >
                {isLoading ? '生成中...' : '生成创意写作'}
            </button>
        </div>
    );

    return (
        <div className={`content-page ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="content-header">
                <button className="content-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="content-title">✍️ 内容创作</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 标签切换 */}
            <div className="content-tabs">
                <button
                    className={`content-tab ${activeTab === 'story' ? 'active' : ''}`}
                    onClick={() => setActiveTab('story')}
                >
                    <span className="content-tab-icon">📖</span>
                    故事生成
                </button>
                <button
                    className={`content-tab ${activeTab === 'poetry' ? 'active' : ''}`}
                    onClick={() => setActiveTab('poetry')}
                >
                    <span className="content-tab-icon">🎭</span>
                    诗歌创作
                </button>
                <button
                    className={`content-tab ${activeTab === 'creative' ? 'active' : ''}`}
                    onClick={() => setActiveTab('creative')}
                >
                    <span className="content-tab-icon">✨</span>
                    创意写作
                </button>
            </div>

            <div className="content-content">
                <div className="content-card">
                    <h3>
                        {activeTab === 'story' && '📖 故事生成'}
                        {activeTab === 'poetry' && '🎭 诗歌创作'}
                        {activeTab === 'creative' && '✨ 创意写作'}
                    </h3>

                    {activeTab === 'story' && renderStoryForm()}
                    {activeTab === 'poetry' && renderPoetryForm()}
                    {activeTab === 'creative' && renderCreativeForm()}

                    {/* 生成结果 */}
                    {result && (
                        <div className="content-result">
                            <div className="content-result-title">生成结果</div>
                            <div className="content-result-content">{result}</div>
                        </div>
                    )}

                    {/* 加载状态 */}
                    {isLoading && (
                        <div className="content-loading">
                            <div className="content-loading-spinner"></div>
                            <div className="content-loading-text">正在生成内容...</div>
                        </div>
                    )}
                </div>

                {/* 历史记录 */}
                {history.length > 0 && (
                    <div className="content-card">
                        <h3>📚 创作历史</h3>
                        <div className="content-history-list">
                            {history.map(item => (
                                <div key={item.id} className="content-history-item">
                                    <div className="content-history-item-title">
                                        {item.type === 'story' && '📖 '}
                                        {item.type === 'poetry' && '🎭 '}
                                        {item.type === 'creative' && '✨ '}
                                        {item.title}
                                    </div>
                                    <div className="content-history-item-meta">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentCreation;