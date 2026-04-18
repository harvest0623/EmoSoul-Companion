import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import './SelfExploration.css';

const SelfExploration = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();

    const [activeTab, setActiveTab] = useState('personality');
    const [testInProgress, setTestInProgress] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState({ title: '', description: '', deadline: '' });

    // 人格测试题目
    const personalityQuestions = [
        {
            id: 1,
            question: '在社交场合中，你通常会：',
            options: [
                { text: '主动与很多人交流', value: 'E' },
                { text: '只与少数熟悉的人交谈', value: 'I' }
            ]
        },
        {
            id: 2,
            question: '你更关注：',
            options: [
                { text: '具体的事实和细节', value: 'S' },
                { text: '整体的模式和可能性', value: 'N' }
            ]
        },
        {
            id: 3,
            question: '做决策时，你更倾向于：',
            options: [
                { text: '基于逻辑和分析', value: 'T' },
                { text: '考虑他人的感受和价值观', value: 'F' }
            ]
        },
        {
            id: 4,
            question: '你更喜欢：',
            options: [
                { text: '有计划、有条理的生活', value: 'J' },
                { text: '灵活、随性的生活', value: 'P' }
            ]
        },
        {
            id: 5,
            question: '你更享受：',
            options: [
                { text: '热闹的聚会活动', value: 'E' },
                { text: '安静的独处时光', value: 'I' }
            ]
        },
        {
            id: 6,
            question: '你认为更重要的是：',
            options: [
                { text: '实际可行的方案', value: 'S' },
                { text: '创新的想法', value: 'N' }
            ]
        },
        {
            id: 7,
            question: '你更看重：',
            options: [
                { text: '公平和正义', value: 'T' },
                { text: '和谐和同理心', value: 'F' }
            ]
        },
        {
            id: 8,
            question: '面对最后期限，你会：',
            options: [
                { text: '提前完成，留出缓冲时间', value: 'J' },
                { text: '在压力下高效工作', value: 'P' }
            ]
        }
    ];

    // 价值观探索
    const valuesOptions = [
        { id: 'family', label: '家庭', icon: '👨‍👩‍👧‍👦' },
        { id: 'career', label: '事业', icon: '💼' },
        { id: 'health', label: '健康', icon: '💪' },
        { id: 'freedom', label: '自由', icon: '🗽' },
        { id: 'love', label: '爱情', icon: '❤️' },
        { id: 'friendship', label: '友谊', icon: '🤝' },
        { id: 'knowledge', label: '知识', icon: '📚' },
        { id: 'creativity', label: '创意', icon: '🎨' },
        { id: 'wealth', label: '财富', icon: '💰' },
        { id: 'happiness', label: '幸福', icon: '😊' },
        { id: 'peace', label: '平静', icon: '🧘' },
        { id: 'adventure', label: '冒险', icon: '🌍' }
    ];

    const [selectedValues, setSelectedValues] = useState([]);

    // 加载本地数据
    useEffect(() => {
        const savedGoals = localStorage.getItem('selfExplorationGoals');
        const savedValues = localStorage.getItem('selfExplorationValues');
        const savedPersonality = localStorage.getItem('selfExplorationPersonality');

        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedValues) setSelectedValues(JSON.parse(savedValues));
        if (savedPersonality) setResult(JSON.parse(savedPersonality));
    }, []);

    // 保存数据
    useEffect(() => {
        localStorage.setItem('selfExplorationGoals', JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        localStorage.setItem('selfExplorationValues', JSON.stringify(selectedValues));
    }, [selectedValues]);

    // 开始测试
    const startTest = () => {
        setTestInProgress(true);
        setCurrentQuestion(0);
        setAnswers({});
        setShowResult(false);
    };

    // 回答问题
    const answerQuestion = (value) => {
        const question = personalityQuestions[currentQuestion];
        setAnswers(prev => ({ ...prev, [question.id]: value }));

        if (currentQuestion < personalityQuestions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            calculateResult();
        }
    };

    // 计算结果
    const calculateResult = () => {
        const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        Object.values(answers).forEach(value => {
            counts[value]++;
        });

        const personality =
            (counts.E >= counts.I ? 'E' : 'I') +
            (counts.S >= counts.N ? 'S' : 'N') +
            (counts.T >= counts.F ? 'T' : 'F') +
            (counts.J >= counts.P ? 'J' : 'P');

        const personalityDescriptions = {
            'INTJ': { name: '建筑师', description: '富有想象力和战略性的思想家，一切皆在计划之中。' },
            'INTP': { name: '逻辑学家', description: '具有创造力的发明家，对知识有着止不住的渴望。' },
            'ENTJ': { name: '指挥官', description: '大胆、富有想象力且意志强大的领导者。' },
            'ENTP': { name: '辩论家', description: '聪明好奇的思想者，不会放弃任何智力上的挑战。' },
            'INFJ': { name: '提倡者', description: '安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。' },
            'INFP': { name: '调停者', description: '诗意、善良的利他主义者，总是热情地为正当理由提供帮助。' },
            'ENFJ': { name: '主人公', description: '富有魅力且鼓舞人心的领导者，有使人着迷的能力。' },
            'ENFP': { name: '竞选者', description: '热情、有创造力且社交自由的人，总能找到微笑的理由。' },
            'ISTJ': { name: '物流师', description: '实际且注重事实的个人，可靠性不容怀疑。' },
            'ISFJ': { name: '守卫者', description: '非常专注且热情的保护者，时刻准备保护所爱之人。' },
            'ESTJ': { name: '总经理', description: '出色的管理者，在管理事情或人的方面无与伦比。' },
            'ESFJ': { name: '执政官', description: '极有同情心、爱社交且受欢迎的人，热衷于帮助他人。' },
            'ISTP': { name: '鉴赏家', description: '大胆而实际的实验家，擅长使用任何形式的工具。' },
            'ISFP': { name: '探险家', description: '灵活且有魅力的艺术家，时刻准备探索和体验新事物。' },
            'ESTP': { name: '企业家', description: '聪明、精力充沛且善于感知的人，真正享受生活在边缘。' },
            'ESFP': { name: '表演者', description: '自发的、精力充沛的艺人，生活永远不会在他们身边感到无聊。' }
        };

        const resultData = {
            type: personality,
            ...personalityDescriptions[personality],
            date: new Date().toISOString()
        };

        setResult(resultData);
        localStorage.setItem('selfExplorationPersonality', JSON.stringify(resultData));
        setTestInProgress(false);
        setShowResult(true);
        toast.success('测试完成！');
    };

    // 切换价值观选择
    const toggleValue = (valueId) => {
        setSelectedValues(prev => {
            if (prev.includes(valueId)) {
                return prev.filter(id => id !== valueId);
            } else {
                if (prev.length >= 5) {
                    toast.error('最多选择5个价值观');
                    return prev;
                }
                return [...prev, valueId];
            }
        });
    };

    // 添加目标
    const addGoal = () => {
        if (!newGoal.title) {
            toast.error('请输入目标标题');
            return;
        }

        const goal = {
            id: Date.now(),
            ...newGoal,
            completed: false,
            createdAt: new Date().toISOString()
        };

        setGoals(prev => [...prev, goal]);
        setNewGoal({ title: '', description: '', deadline: '' });
        toast.success('目标添加成功！');
    };

    // 切换目标完成状态
    const toggleGoalComplete = (id) => {
        setGoals(prev => prev.map(goal =>
            goal.id === id ? { ...goal, completed: !goal.completed } : goal
        ));
    };

    // 删除目标
    const deleteGoal = (id) => {
        setGoals(prev => prev.filter(goal => goal.id !== id));
        toast.success('目标已删除');
    };

    return (
        <div className={`self-exploration-page ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="self-exploration-header">
                <button className="self-exploration-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="self-exploration-title">🔍 自我探索</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 标签切换 */}
            <div className="self-tabs">
                <button
                    className={`self-tab ${activeTab === 'personality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personality')}
                >
                    <span className="self-tab-icon">🧩</span>
                    人格测试
                </button>
                <button
                    className={`self-tab ${activeTab === 'values' ? 'active' : ''}`}
                    onClick={() => setActiveTab('values')}
                >
                    <span className="self-tab-icon">💎</span>
                    价值观探索
                </button>
                <button
                    className={`self-tab ${activeTab === 'goals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('goals')}
                >
                    <span className="self-tab-icon">🎯</span>
                    目标设定
                </button>
            </div>

            <div className="self-content">
                {/* 人格测试 */}
                {activeTab === 'personality' && (
                    <div className="self-card">
                        {!testInProgress && !showResult && (
                            <div className="test-start">
                                <div className="test-intro">
                                    <div className="intro-icon">🧩</div>
                                    <h2>MBTI人格测试</h2>
                                    <p>通过8道简单的问题，探索你的性格类型</p>
                                </div>
                                {result && (
                                    <div className="previous-result">
                                        <h3>上次测试结果</h3>
                                        <div className="result-preview">
                                            <span className="result-type">{result.type}</span>
                                            <span className="result-name">{result.name}</span>
                                        </div>
                                        <p className="result-date">
                                            {new Date(result.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                <button className="self-btn self-btn-primary" onClick={startTest}>
                                    {result ? '重新测试' : '开始测试'}
                                </button>
                            </div>
                        )}

                        {testInProgress && (
                            <div className="test-question">
                                <div className="progress-info">
                                    问题 {currentQuestion + 1} / {personalityQuestions.length}
                                </div>
                                <div className="progress-bar-small">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${((currentQuestion + 1) / personalityQuestions.length) * 100}%` }}
                                    />
                                </div>
                                <h3>{personalityQuestions[currentQuestion].question}</h3>
                                <div className="options-list">
                                    {personalityQuestions[currentQuestion].options.map((option, index) => (
                                        <button
                                            key={index}
                                            className="option-btn"
                                            onClick={() => answerQuestion(option.value)}
                                        >
                                            {option.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showResult && result && (
                            <div className="test-result">
                                <div className="result-header">
                                    <span className="result-type-badge">{result.type}</span>
                                    <h2>{result.name}</h2>
                                </div>
                                <p className="result-description">{result.description}</p>
                                <button className="self-btn self-btn-primary" onClick={() => setShowResult(false)}>
                                    完成
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 价值观探索 */}
                {activeTab === 'values' && (
                    <div className="self-card">
                        <h2>选择你最重要的5个价值观</h2>
                        <p className="values-hint">点击选择，已选择 {selectedValues.length}/5</p>
                        <div className="values-grid">
                            {valuesOptions.map(value => (
                                <div
                                    key={value.id}
                                    className={`value-item ${selectedValues.includes(value.id) ? 'selected' : ''}`}
                                    onClick={() => toggleValue(value.id)}
                                >
                                    <span className="value-icon">{value.icon}</span>
                                    <span className="value-label">{value.label}</span>
                                </div>
                            ))}
                        </div>
                        {selectedValues.length > 0 && (
                            <div className="selected-values">
                                <h3>你的核心价值观</h3>
                                <div className="selected-list">
                                    {selectedValues.map(id => {
                                        const value = valuesOptions.find(v => v.id === id);
                                        return (
                                            <span key={id} className="selected-tag">
                                                {value.icon} {value.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 目标设定 */}
                {activeTab === 'goals' && (
                    <div className="self-card">
                        <h2>设定你的目标</h2>
                        <div className="goal-form">
                            <input
                                type="text"
                                className="self-input"
                                placeholder="目标标题"
                                value={newGoal.title}
                                onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <textarea
                                className="self-textarea"
                                placeholder="详细描述"
                                value={newGoal.description}
                                onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                            <input
                                type="date"
                                className="self-input"
                                value={newGoal.deadline}
                                onChange={e => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                            />
                            <button className="self-btn self-btn-primary" onClick={addGoal}>
                                添加目标
                            </button>
                        </div>

                        <div className="goals-list">
                            {goals.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🎯</div>
                                    <div className="empty-text">还没有设定目标</div>
                                    <div className="empty-subtext">添加你的第一个目标吧！</div>
                                </div>
                            ) : (
                                goals.map(goal => (
                                    <div key={goal.id} className={`goal-item ${goal.completed ? 'completed' : ''}`}>
                                        <input
                                            type="checkbox"
                                            className="goal-checkbox"
                                            checked={goal.completed}
                                            onChange={() => toggleGoalComplete(goal.id)}
                                        />
                                        <div className="goal-content">
                                            <div className="goal-title">{goal.title}</div>
                                            {goal.description && (
                                                <div className="goal-description">{goal.description}</div>
                                            )}
                                            {goal.deadline && (
                                                <div className="goal-deadline">截止：{goal.deadline}</div>
                                            )}
                                        </div>
                                        <button
                                            className="goal-delete"
                                            onClick={() => deleteGoal(goal.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelfExploration;
