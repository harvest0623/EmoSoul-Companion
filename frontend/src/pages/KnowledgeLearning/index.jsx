import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import './KnowledgeLearning.css';

/**
 * 知识学习页面
 */
const KnowledgeLearning = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();

    const [activeTab, setActiveTab] = useState('subjects');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [learningProgress, setLearningProgress] = useState(0);

    // 学科辅导数据
    const subjects = [
        { id: 1, name: '数学', icon: '🧮', level: '初中', description: '基础代数、几何、函数等', lessons: 12 },
        { id: 2, name: '英语', icon: '📝', level: '高中', description: '语法、词汇、阅读、写作', lessons: 15 },
        { id: 3, name: '物理', icon: '⚡', level: '高中', description: '力学、热学、电磁学', lessons: 10 },
        { id: 4, name: '化学', icon: '🧪', level: '高中', description: '化学反应、元素周期表', lessons: 8 },
        { id: 5, name: '生物', icon: '🧬', level: '高中', description: '细胞结构、遗传学、生态', lessons: 9 },
        { id: 6, name: '语文', icon: '📖', level: '高中', description: '阅读理解、作文、古诗文', lessons: 14 }
    ];

    // 语言学习数据
    const languages = [
        { id: 1, name: '英语', icon: '🇺🇸', level: '初级', description: '基础日常用语', lessons: 20 },
        { id: 2, name: '日语', icon: '🇯🇵', level: '入门', description: '假名、基础会话', lessons: 18 },
        { id: 3, name: '韩语', icon: '🇰🇷', level: '入门', description: '基础发音、日常用语', lessons: 16 },
        { id: 4, name: '法语', icon: '🇫🇷', level: '入门', description: '基础语法、日常会话', lessons: 15 },
        { id: 5, name: '西班牙语', icon: '🇪🇸', level: '入门', description: '基础词汇、发音', lessons: 14 },
        { id: 6, name: '德语', icon: '🇩🇪', level: '入门', description: '基础语法、日常用语', lessons: 12 }
    ];

    // 技能培训数据
    const skills = [
        { id: 1, name: '编程', icon: '💻', level: '初级', description: 'Python基础、Web开发', lessons: 25 },
        { id: 2, name: '设计', icon: '🎨', level: '入门', description: 'Photoshop、设计原理', lessons: 18 },
        { id: 3, name: '写作', icon: '✍️', level: '进阶', description: '创意写作、文案策划', lessons: 15 },
        { id: 4, name: '演讲', icon: '🎤', level: '中级', description: '公共演讲、沟通技巧', lessons: 12 },
        { id: 5, name: '摄影', icon: '📷', level: '入门', description: '构图、曝光、后期', lessons: 16 },
        { id: 6, name: '领导力', icon: '👑', level: '高级', description: '团队管理、决策技巧', lessons: 10 }
    ];

    // 加载学习进度
    useEffect(() => {
        const savedProgress = localStorage.getItem('learningProgress');
        const savedCompleted = localStorage.getItem('completedLessons');
        if (savedProgress) {
            setLearningProgress(parseFloat(savedProgress));
        }
        if (savedCompleted) {
            setCompletedLessons(JSON.parse(savedCompleted));
        }
    }, []);

    // 保存学习进度
    useEffect(() => {
        localStorage.setItem('learningProgress', learningProgress.toString());
    }, [learningProgress]);

    useEffect(() => {
        localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
    }, [completedLessons]);

    // 开始学习
    const startLearning = (type, item) => {
        if (type === 'subjects') {
            setSelectedSubject(item);
        } else if (type === 'languages') {
            setSelectedLanguage(item);
        } else if (type === 'skills') {
            setSelectedSkill(item);
        }
        toast.success(`开始学习 ${item.name}！`);
    };

    // 完成学习
    const completeLesson = (type, item) => {
        const key = `${type}_${item.id}`;
        if (!completedLessons.includes(key)) {
            setCompletedLessons(prev => [...prev, key]);
            setLearningProgress(prev => Math.min(100, prev + (100 / (subjects.length + languages.length + skills.length))));
            toast.success(`完成了 ${item.name} 的学习！`);
        }
    };

    // 检查是否已完成
    const isCompleted = (type, item) => {
        const key = `${type}_${item.id}`;
        return completedLessons.includes(key);
    };

    // 渲染学科辅导
    const renderSubjects = () => (
        <div className="subjects-container">
            <div className="section-header">
                <h3>🧮 学科辅导</h3>
                <p>选择您需要学习的学科，开始系统化学习</p>
            </div>
            <div className="subjects-grid">
                {subjects.map(subject => (
                    <div key={subject.id} className={`subject-card ${isCompleted('subjects', subject) ? 'completed' : ''}`}>
                        <div className="subject-icon">{subject.icon}</div>
                        <h4>{subject.name}</h4>
                        <div className="subject-info">
                            <span className="level-tag">{subject.level}</span>
                            <span className="lessons-count">{subject.lessons} 课时</span>
                        </div>
                        <p>{subject.description}</p>
                        <div className="subject-actions">
                            {isCompleted('subjects', subject) ? (
                                <button className="completed-btn" disabled>
                                    ✅ 已完成
                                </button>
                            ) : (
                                <button className="start-btn" onClick={() => startLearning('subjects', subject)}>
                                    开始学习
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 渲染语言学习
    const renderLanguages = () => (
        <div className="languages-container">
            <div className="section-header">
                <h3>🌍 语言学习</h3>
                <p>学习不同国家的语言，拓展国际视野</p>
            </div>
            <div className="languages-grid">
                {languages.map(language => (
                    <div key={language.id} className={`language-card ${isCompleted('languages', language) ? 'completed' : ''}`}>
                        <div className="language-icon">{language.icon}</div>
                        <h4>{language.name}</h4>
                        <div className="language-info">
                            <span className="level-tag">{language.level}</span>
                            <span className="lessons-count">{language.lessons} 课时</span>
                        </div>
                        <p>{language.description}</p>
                        <div className="language-actions">
                            {isCompleted('languages', language) ? (
                                <button className="completed-btn" disabled>
                                    ✅ 已完成
                                </button>
                            ) : (
                                <button className="start-btn" onClick={() => startLearning('languages', language)}>
                                    开始学习
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 渲染技能培训
    const renderSkills = () => (
        <div className="skills-container">
            <div className="section-header">
                <h3>💡 技能培训</h3>
                <p>学习实用技能，提升个人能力</p>
            </div>
            <div className="skills-grid">
                {skills.map(skill => (
                    <div key={skill.id} className={`skill-card ${isCompleted('skills', skill) ? 'completed' : ''}`}>
                        <div className="skill-icon">{skill.icon}</div>
                        <h4>{skill.name}</h4>
                        <div className="skill-info">
                            <span className="level-tag">{skill.level}</span>
                            <span className="lessons-count">{skill.lessons} 课时</span>
                        </div>
                        <p>{skill.description}</p>
                        <div className="skill-actions">
                            {isCompleted('skills', skill) ? (
                                <button className="completed-btn" disabled>
                                    ✅ 已完成
                                </button>
                            ) : (
                                <button className="start-btn" onClick={() => startLearning('skills', skill)}>
                                    开始学习
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 渲染学习详情
    const renderLearningDetail = () => {
        let item = selectedSubject || selectedLanguage || selectedSkill;
        if (!item) return null;

        return (
            <div className="learning-detail">
                <div className="detail-header">
                    <button className="back-btn" onClick={() => {
                        setSelectedSubject(null);
                        setSelectedLanguage(null);
                        setSelectedSkill(null);
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3>{item.name} - 学习详情</h3>
                </div>

                <div className="detail-content">
                    <div className="detail-info">
                        <div className="detail-icon">{item.icon}</div>
                        <div className="detail-text">
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                            <div className="detail-meta">
                                <span className="level-tag">{item.level}</span>
                                <span className="lessons-count">{item.lessons} 课时</span>
                            </div>
                        </div>
                    </div>

                    <div className="lesson-plan">
                        <h4>学习计划</h4>
                        <div className="lesson-list">
                            {Array.from({ length: item.lessons }).map((_, index) => (
                                <div key={index} className="lesson-item">
                                    <span className="lesson-number">第 {index + 1} 课</span>
                                    <span className="lesson-title">{item.name} 基础 {index + 1}</span>
                                    <button
                                        className="complete-btn"
                                        onClick={() => {
                                            if (selectedSubject) completeLesson('subjects', selectedSubject);
                                            if (selectedLanguage) completeLesson('languages', selectedLanguage);
                                            if (selectedSkill) completeLesson('skills', selectedSkill);
                                        }}
                                    >
                                        标记完成
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`knowledge-page ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="knowledge-header">
                <button className="knowledge-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="knowledge-title">📚 知识学习</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 学习进度 */}
            <div className="progress-section">
                <div className="progress-header">
                    <h3>🎯 学习进度</h3>
                    <span className="progress-percentage">{Math.round(learningProgress)}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${learningProgress}%` }}
                    ></div>
                </div>
                <p className="progress-text">已完成 {completedLessons.length} / {subjects.length + languages.length + skills.length} 个学习项目</p>
            </div>

            {/* 标签切换 */}
            <div className="knowledge-tabs">
                <button
                    className={`knowledge-tab ${activeTab === 'subjects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subjects')}
                >
                    <span className="knowledge-tab-icon">🧮</span>
                    学科辅导
                </button>
                <button
                    className={`knowledge-tab ${activeTab === 'languages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('languages')}
                >
                    <span className="knowledge-tab-icon">🌍</span>
                    语言学习
                </button>
                <button
                    className={`knowledge-tab ${activeTab === 'skills' ? 'active' : ''}`}
                    onClick={() => setActiveTab('skills')}
                >
                    <span className="knowledge-tab-icon">💡</span>
                    技能培训
                </button>
            </div>

            <div className="knowledge-content">
                {selectedSubject || selectedLanguage || selectedSkill ? (
                    renderLearningDetail()
                ) : (
                    <>
                        {activeTab === 'subjects' && renderSubjects()}
                        {activeTab === 'languages' && renderLanguages()}
                        {activeTab === 'skills' && renderSkills()}
                    </>
                )}
            </div>
        </div>
    );
};

export default KnowledgeLearning;
