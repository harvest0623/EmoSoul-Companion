import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import './LeisureInteraction.css';

/**
 * 休闲互动页面
 */
const LeisureInteraction = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();

    const [activeTab, setActiveTab] = useState('games');
    const [gameScore, setGameScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [musicPlaying, setMusicPlaying] = useState(false);

    // 文字游戏 - 谜语题库
    const riddles = [
        {
            question: '什么东西越洗越脏？',
            options: ['衣服', '水', '手', '碗'],
            answer: '水'
        },
        {
            question: '什么路最窄？',
            options: ['小路', '水路', '冤家路窄', '山路'],
            answer: '冤家路窄'
        },
        {
            question: '什么东西能吃不能碰？',
            options: ['亏', '饭', '菜', '水果'],
            answer: '亏'
        },
        {
            question: '什么球不能踢？',
            options: ['足球', '地球', '篮球', '乒乓球'],
            answer: '地球'
        },
        {
            question: '什么东西有头无脚？',
            options: ['桌子', '床', '砖头', '椅子'],
            answer: '砖头'
        }
    ];

    // 兴趣话题
    const topics = [
        { id: 1, title: '科幻世界', content: '探讨未来科技、太空探索、人工智能等前沿话题', icon: '🚀', color: 'topic-scifi' },
        { id: 2, title: '文学艺术', content: '分享读书心得、诗歌创作、艺术欣赏等', icon: '📚', color: 'topic-literature' },
        { id: 3, title: '美食探店', content: '发现美食、分享食谱、烹饪技巧交流', icon: '🍜', color: 'topic-food' },
        { id: 4, title: '旅行记忆', content: '分享旅行经历、美景照片、攻略指南', icon: '✈️', color: 'topic-travel' },
        { id: 5, title: '音乐时光', content: '推荐好歌、音乐赏析、乐器学习', icon: '🎵', color: 'topic-music' },
        { id: 6, title: '运动健身', content: '健身心得、运动技巧、健康生活分享', icon: '🏃', color: 'topic-sport' }
    ];

    // 音乐推荐
    const musicList = [
        { id: 1, title: '夜空中最亮的星', artist: '逃跑计划', genre: '摇滚', mood: '激励', cover: '⭐' },
        { id: 2, title: '稻香', artist: '周杰伦', genre: '流行', mood: '温馨', cover: '🌾' },
        { id: 3, title: '起风了', artist: '买辣椒也用券', genre: '流行', mood: '治愈', cover: '🍃' },
        { id: 4, title: '平凡之路', artist: '朴树', genre: '民谣', mood: '励志', cover: '🛤️' },
        { id: 5, title: '晴天', artist: '周杰伦', genre: '流行', mood: '怀旧', cover: '☀️' },
        { id: 6, title: '追光者', artist: '岑宁儿', genre: '流行', mood: '感动', cover: '✨' }
    ];

    // 加载收藏
    useEffect(() => {
        const savedFavorites = localStorage.getItem('leisureFavorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    // 保存收藏
    useEffect(() => {
        localStorage.setItem('leisureFavorites', JSON.stringify(favorites));
    }, [favorites]);

    // 开始游戏
    const startGame = () => {
        setGameStarted(true);
        setCurrentQuestion(0);
        setGameScore(0);
        setSelectedAnswer(null);
        setAnswered(false);
        toast.success('游戏开始！');
    };

    // 选择答案
    const selectAnswer = (answer) => {
        if (answered) return;
        setSelectedAnswer(answer);
        setAnswered(true);
        if (answer === riddles[currentQuestion].answer) {
            setGameScore(prev => prev + 1);
            toast.success('回答正确！');
        } else {
            toast.error('回答错误！');
        }
    };

    // 下一题
    const nextQuestion = () => {
        if (currentQuestion < riddles.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setAnswered(false);
        } else {
            toast.success(`游戏结束！您的得分：${gameScore}/${riddles.length}`);
            setGameStarted(false);
        }
    };

    // 切换收藏
    const toggleFavorite = (id, type, item) => {
        const existingItem = favorites.find(f => f.id === id && f.type === type);
        if (existingItem) {
            setFavorites(prev => prev.filter(f => !(f.id === id && f.type === type)));
            toast('已取消收藏');
        } else {
            setFavorites(prev => [...prev, { id, type, item, timestamp: Date.now() }]);
            toast.success('已收藏');
        }
    };

    // 检查是否已收藏
    const isFavorite = (id, type) => {
        return favorites.some(f => f.id === id && f.type === type);
    };

    // 播放音乐
    const playMusic = (id) => {
        setMusicPlaying(musicPlaying === id ? null : id);
        if (musicPlaying !== id) {
            toast.success('开始播放');
        } else {
            toast('已暂停');
        }
    };

    // 渲染文字游戏
    const renderGames = () => (
        <div className="games-container">
            {!gameStarted ? (
                <div className="game-welcome">
                    <div className="welcome-icon">🎯</div>
                    <h3>谜语猜一猜</h3>
                    <p>考验你的智慧，回答有趣的谜语</p>
                    <p className="game-info">共 {riddles.length} 道题目</p>
                    <button className="start-btn" onClick={startGame}>
                        开始游戏
                    </button>
                </div>
            ) : (
                <div className="game-playing">
                    <div className="game-header">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${((currentQuestion + 1) / riddles.length) * 100}%` }}
                            ></div>
                        </div>
                        <div className="game-info-top">
                            <span>第 {currentQuestion + 1} 题 / 共 {riddles.length} 题</span>
                            <span>得分：{gameScore}</span>
                        </div>
                    </div>

                    <div className="question-card">
                        <h4>{riddles[currentQuestion].question}</h4>
                        <div className="options-list">
                            {riddles[currentQuestion].options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`option-btn ${selectedAnswer === option
                                            ? (option === riddles[currentQuestion].answer ? 'correct' : 'wrong')
                                            : ''
                                        } ${answered && option === riddles[currentQuestion].answer ? 'correct' : ''}`}
                                    onClick={() => selectAnswer(option)}
                                    disabled={answered}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {answered && (
                        <button className="next-btn" onClick={nextQuestion}>
                            {currentQuestion < riddles.length - 1 ? '下一题' : '查看结果'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    // 渲染兴趣话题
    const renderTopics = () => (
        <div className="topics-container">
            <div className="topics-grid">
                {topics.map(topic => (
                    <div key={topic.id} className="topic-card">
                        <div className={`topic-icon ${topic.color}`}>{topic.icon}</div>
                        <h4>{topic.title}</h4>
                        <p>{topic.content}</p>
                        <div className="topic-actions">
                            <button
                                className={`favorite-btn ${isFavorite(topic.id, 'topic') ? 'favorited' : ''}`}
                                onClick={() => toggleFavorite(topic.id, 'topic', topic)}
                            >
                                {isFavorite(topic.id, 'topic') ? '❤️ 已收藏' : '🤍 收藏'}
                            </button>
                            <button className="discuss-btn" onClick={() => toast.success('进入话题讨论')}>
                                💬 讨论
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 渲染音乐推荐
    const renderMusic = () => (
        <div className="music-container">
            <div className="music-list">
                {musicList.map(music => (
                    <div key={music.id} className={`music-card ${musicPlaying === music.id ? 'playing' : ''}`}>
                        <div className="music-cover">{music.cover}</div>
                        <div className="music-info">
                            <h4>{music.title}</h4>
                            <p>{music.artist}</p>
                            <div className="music-tags">
                                <span className="tag">{music.genre}</span>
                                <span className="tag">{music.mood}</span>
                            </div>
                        </div>
                        <div className="music-actions">
                            <button
                                className="play-btn"
                                onClick={() => playMusic(music.id)}
                            >
                                {musicPlaying === music.id ? '⏸️' : '▶️'}
                            </button>
                            <button
                                className={`favorite-btn ${isFavorite(music.id, 'music') ? 'favorited' : ''}`}
                                onClick={() => toggleFavorite(music.id, 'music', music)}
                            >
                                {isFavorite(music.id, 'music') ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`leisure-page ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="leisure-header">
                <button className="leisure-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="leisure-title">🎮 休闲互动</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 标签切换 */}
            <div className="leisure-tabs">
                <button
                    className={`leisure-tab ${activeTab === 'games' ? 'active' : ''}`}
                    onClick={() => setActiveTab('games')}
                >
                    <span className="leisure-tab-icon">🎯</span>
                    文字游戏
                </button>
                <button
                    className={`leisure-tab ${activeTab === 'topics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('topics')}
                >
                    <span className="leisure-tab-icon">💬</span>
                    兴趣话题
                </button>
                <button
                    className={`leisure-tab ${activeTab === 'music' ? 'active' : ''}`}
                    onClick={() => setActiveTab('music')}
                >
                    <span className="leisure-tab-icon">🎵</span>
                    音乐推荐
                </button>
                <button
                    className={`leisure-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    <span className="leisure-tab-icon">❤️</span>
                    我的收藏
                </button>
            </div>

            <div className="leisure-content">
                {activeTab === 'games' && renderGames()}
                {activeTab === 'topics' && renderTopics()}
                {activeTab === 'music' && renderMusic()}
                {activeTab === 'favorites' && (
                    <div className="favorites-container">
                        {favorites.length === 0 ? (
                            <div className="empty-favorites">
                                <div className="empty-icon">📭</div>
                                <h3>还没有收藏</h3>
                                <p>快去收藏喜欢的话题和音乐吧</p>
                            </div>
                        ) : (
                            <div className="favorites-list">
                                {favorites.map((fav, index) => (
                                    <div key={index} className="favorite-item">
                                        <div className="favorite-type">
                                            {fav.type === 'topic' && '💬 话题'}
                                            {fav.type === 'music' && '🎵 音乐'}
                                        </div>
                                        <div className="favorite-content">
                                            <h4>{fav.item.title}</h4>
                                            {fav.item.description && <p>{fav.item.description}</p>}
                                            {fav.item.artist && <p>{fav.item.artist}</p>}
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => toggleFavorite(fav.id, fav.type)}
                                        >
                                            移除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeisureInteraction;