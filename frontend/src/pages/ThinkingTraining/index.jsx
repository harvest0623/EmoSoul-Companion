import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';
import './ThinkingTraining.css';

const ThinkingTraining = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState('creative');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState('');
  const [completedTasks, setCompletedTasks] = useState(0);
  const totalTasks = 12;

  // 思维训练问题库
  const questions = {
    creative: [
      {
        id: 1,
        question: '如果你能发明一种新工具，它会是什么？它能解决什么问题？',
        guidance: '尝试从日常生活中的痛点出发，思考一个创新的解决方案。',
        tips: '可以考虑环保、健康、效率等方面的需求。'
      },
      {
        id: 2,
        question: '如果动物会说话，你最想和哪种动物交谈？你会问它什么问题？',
        guidance: '想象与不同动物交流的场景，思考它们可能的视角。',
        tips: '可以考虑动物的生活习性和它们独特的感知能力。'
      },
      {
        id: 3,
        question: '如果一天有48小时，你会如何安排额外的时间？',
        guidance: '思考如何平衡工作、学习、休闲和个人发展。',
        tips: '考虑长期目标和短期需求的平衡。'
      }
    ],
    critical: [
      {
        id: 1,
        question: '如何判断一个信息是否可靠？你会使用哪些方法验证？',
        guidance: '思考信息来源、逻辑一致性和证据支持等因素。',
        tips: '可以考虑交叉验证、权威性和时效性等方面。'
      },
      {
        id: 2,
        question: '如果你的观点与大多数人不同，你会如何说服别人？',
        guidance: '思考有效沟通的策略和逻辑论证的方法。',
        tips: '可以考虑倾听对方观点、提供具体证据和建立共识。'
      },
      {
        id: 3,
        question: '如何评估一个决策的风险和收益？',
        guidance: '思考系统性分析问题的方法和权衡利弊的策略。',
        tips: '可以考虑概率分析、影响范围和长期后果。'
      }
    ],
    problemSolving: [
      {
        id: 1,
        question: '如果你的手机丢失了，你会采取哪些步骤找回它？',
        guidance: '思考系统性解决问题的方法和优先级。',
        tips: '可以考虑定位功能、联系运营商和报警等措施。'
      },
      {
        id: 2,
        question: '如何在有限的预算下规划一次愉快的旅行？',
        guidance: '思考资源优化和优先级设置的方法。',
        tips: '可以考虑错峰出行、灵活住宿和本地体验等策略。'
      },
      {
        id: 3,
        question: '如果团队成员意见分歧，你会如何促进有效沟通和达成共识？',
        guidance: '思考冲突管理和团队协作的方法。',
        tips: '可以考虑倾听各方观点、寻找共同点和制定妥协方案。'
      }
    ],
    decisionMaking: [
      {
        id: 1,
        question: '在职业选择中，你会如何平衡兴趣和收入？',
        guidance: '思考个人价值观和长期目标的重要性。',
        tips: '可以考虑职业发展前景、工作满意度和生活质量。'
      },
      {
        id: 2,
        question: '如何在紧急情况下做出快速而明智的决策？',
        guidance: '思考压力下的决策策略和信息处理方法。',
        tips: '可以考虑设定清晰目标、快速评估选项和接受合理风险。'
      },
      {
        id: 3,
        question: '在面对多个重要任务时，你会如何排序和管理时间？',
        guidance: '思考优先级设置和时间管理的有效方法。',
        tips: '可以考虑紧急重要矩阵、时间块分配和任务分解。'
      }
    ]
  };

  // 获取随机问题
  const getRandomQuestion = (category) => {
    const categoryQuestions = questions[category];
    const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
    return categoryQuestions[randomIndex];
  };

  // 开始新的训练
  const startNewTraining = () => {
    const question = getRandomQuestion(selectedCategory);
    setCurrentQuestion(question);
    setUserAnswer('');
    setShowResult(false);
    setResult('');
  };

  // 提交答案
  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    
    // 生成反馈结果
    const feedback = generateFeedback(selectedCategory, userAnswer);
    setResult(feedback);
    setShowResult(true);
    setCompletedTasks(prev => Math.min(prev + 1, totalTasks));
  };

  // 生成反馈
  const generateFeedback = (category, answer) => {
    const feedbacks = {
      creative: [
        '你的回答很有创意！继续保持这种创新思维。',
        '很棒的想法！这种思维方式能够帮助你发现更多可能性。',
        '非常独特的视角！创意就是要打破常规。',
        '你的回答展现了丰富的想象力，继续加油！'
      ],
      critical: [
        '你的分析很深入！批判性思维能够帮助你做出更明智的判断。',
        '很好的逻辑推理！继续培养这种严谨的思考方式。',
        '你的观点很有说服力！批判性思维是解决复杂问题的关键。',
        '非常理性的分析！这种思维方式能够帮助你避免偏见。'
      ],
      problemSolving: [
        '你的解决方案很实用！问题解决能力是生活和工作中的重要技能。',
        '很棒的思路！系统性解决问题能够提高效率。',
        '你的方法很有条理！问题解决需要逻辑和创意的结合。',
        '非常全面的考虑！解决问题时需要兼顾多个因素。'
      ],
      decisionMaking: [
        '你的决策思路很清晰！良好的决策能力能够帮助你把握机会。',
        '很棒的权衡分析！决策过程中需要考虑各种因素的平衡。',
        '你的思考很周全！决策质量直接影响结果的好坏。',
        '非常理性的决策过程！情绪管理在决策中也很重要。'
      ]
    };

    const categoryFeedbacks = feedbacks[category];
    const randomIndex = Math.floor(Math.random() * categoryFeedbacks.length);
    return categoryFeedbacks[randomIndex];
  };

  return (
    <div className={`thinking-training-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="content-header thinking-training-header">
        <button className="content-back-btn thinking-training-back-btn" onClick={() => navigate('/home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="content-title thinking-training-title">🧠 思维训练</h1>
        <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
          <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
        </button>
      </header>

      {/* 学习进度 */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-title">🎯 训练进度</span>
          <span className="progress-percentage">{Math.round((completedTasks / totalTasks) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
          />
        </div>
        <div className="progress-info">
          已完成 {completedTasks} / {totalTasks} 个训练项目
        </div>
      </div>

      {/* 类别选择 */}
      <div className="category-selector">
        <button 
          className={selectedCategory === 'creative' ? 'active' : ''}
          onClick={() => setSelectedCategory('creative')}
        >
          💡 创意思维
        </button>
        <button 
          className={selectedCategory === 'critical' ? 'active' : ''}
          onClick={() => setSelectedCategory('critical')}
        >
          🔍 批判性思维
        </button>
        <button 
          className={selectedCategory === 'problemSolving' ? 'active' : ''}
          onClick={() => setSelectedCategory('problemSolving')}
        >
          🛠️ 问题解决
        </button>
        <button 
          className={selectedCategory === 'decisionMaking' ? 'active' : ''}
          onClick={() => setSelectedCategory('decisionMaking')}
        >
          📋 决策能力
        </button>
      </div>

      {/* 训练内容 */}
      <div className="training-content">
        {!currentQuestion ? (
          <div className="start-section">
            <div className="start-card">
              <div className="section-header">
                <div className="section-icon">🧠</div>
                <h2>思维训练</h2>
                <p>通过问题引导用户思考，提供创意激发和决策辅助</p>
              </div>
              <button className="start-button" onClick={startNewTraining}>
                开始训练
              </button>
            </div>
          </div>
        ) : (
          <div className="question-section">
            <div className="question-card">
              <h2>思考问题</h2>
              <p className="question-text">{currentQuestion.question}</p>
              <div className="question-guidance">
                <h3>思考指导</h3>
                <p>{currentQuestion.guidance}</p>
                <h3>小贴士</h3>
                <p>{currentQuestion.tips}</p>
              </div>
            </div>

            <div className="answer-section">
              <h2>你的回答</h2>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="请输入你的思考..."
                rows={6}
              />
              <div className="button-group">
                <button className="submit-button" onClick={handleSubmitAnswer}>
                  提交回答
                </button>
                <button className="reset-button" onClick={startNewTraining}>
                  换一个问题
                </button>
              </div>
            </div>

            {showResult && (
              <div className="result-section">
                <div className="result-card">
                  <h2>反馈</h2>
                  <p>{result}</p>
                  <button className="continue-button" onClick={startNewTraining}>
                    继续训练
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThinkingTraining;