import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

/**
 * 首页 - 主页面
 */
const Home = () => {
  const navigate = useNavigate();
  const featureRefs = useRef([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRefs = featureRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const features = [
    {
      id: 1,
      title: '情感识别与反馈',
      description: '实时分析用户情绪，自动调整回应语气，提供情绪调节建议',
      icon: '😊',
      color: 'feature-emotion',
      route: '/home/emotion-analysis'
    },
    {
      id: 2,
      title: '个性化定制',
      description: '支持数字人形象定制、性格设定和对话风格调整',
      icon: '🎨',
      color: 'feature-custom',
      route: '/home/digital-human'
    },
    {
      id: 3,
      title: '多模态交互',
      description: '支持语音对话、表情互动和动作反馈',
      icon: '🎭',
      color: 'feature-modal',
      route: '/home/chat'
    },
    {
      id: 4,
      title: '日常管理',
      description: '提供日程提醒、待办事项和习惯养成功能',
      icon: '📅',
      color: 'feature-daily',
      route: '/home/daily-management'
    },
    {
      id: 5,
      title: '健康管理',
      description: '记录情绪日记、追踪睡眠质量、提供减压建议',
      icon: '💪',
      color: 'feature-health',
      route: '/home/health-management'
    },
    {
      id: 6,
      title: '内容创作',
      description: '根据用户提供的主题生成故事、诗歌和创意写作',
      icon: '✍️',
      color: 'feature-create',
      route: '/home/content-creation'
    },
    {
      id: 7,
      title: '休闲互动',
      description: '提供文字游戏、兴趣话题讨论和音乐推荐',
      icon: '🎮',
      color: 'feature-leisure',
      route: '/home/leisure-interaction'
    },
    {
      id: 8,
      title: '知识学习',
      description: '提供学科辅导、语言学习和技能培训',
      icon: '📚',
      color: 'feature-learn',
      route: '/home/knowledge-learning'
    },
    {
      id: 9,
      title: '思维训练',
      description: '通过问题引导用户思考，提供创意激发和决策辅助',
      icon: '🧠',
      color: 'feature-think',
      route: '/home/thinking-training'
    },
    {
      id: 10,
      title: '社交连接',
      description: '提供虚拟朋友圈、兴趣社群和数字人社交功能',
      icon: '🤝',
      color: 'feature-social',
      route: '/home/social-connection'
    },
    {
      id: 11,
      title: '分享功能',
      description: '支持对话分享、情绪卡片生成和成就系统',
      icon: '📤',
      color: 'feature-share',
      route: '/home/share'
    },
    {
      id: 12,
      title: '心理疏导',
      description: '提供情绪倾诉空间、心理支持和专业建议',
      icon: '❤️',
      color: 'feature-psych',
      route: '/home/chat'
    },
    {
      id: 13,
      title: '自我探索',
      description: '提供人格测试、价值观探索和目标设定功能',
      icon: '🔍',
      color: 'feature-explore',
      route: '/home/self-exploration'
    },
    {
      id: 14,
      title: '智能记忆',
      description: '记住用户偏好、保持对话连贯性、从对话中学习',
      icon: '💾',
      color: 'feature-memory',
      route: '/home/chat'
    }
  ];

  const advantages = [
    {
      title: 'AI 驱动',
      description: '利用先进的 AI 技术进行情感分析和智能交互',
      icon: '🤖'
    },
    {
      title: '24/7 陪伴',
      description: '随时在线，为您提供全天候的情感支持',
      icon: '⏰'
    },
    {
      title: '安全隐私',
      description: '所有数据本地处理，确保您的隐私安全',
      icon: '🔒'
    },
    {
      title: '持续学习',
      description: '不断学习您的偏好，提供越来越个性化的服务',
      icon: '📈'
    }
  ];

  return (
    <div className="home-page">
      {/* 顶部导航 */}
      <header className={`home-header ${scrollY > 50 ? 'header-scrolled' : ''}`}>
        <div className="header-brand">
          <h1>语你相伴</h1>
        </div>
        <nav className="header-nav">
          <button className="nav-btn active">首页</button>
          <button className="nav-btn" onClick={() => navigate('/home/chat')}>
            对话
          </button>
          <button className="nav-btn" onClick={() => navigate('/profile')}>
            我的
          </button>
        </nav>
      </header>

      {/* 英雄区域 */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">AI 赋能的情感陪伴</div>
            <h2>语你相伴</h2>
            <p>您的AI数字伙伴，随时为您提供陪伴和支持，理解您的情绪，与您共同成长</p>
            <div className="hero-buttons">
              <button 
                className="hero-btn primary" 
                onClick={() => navigate('/home/chat')}
              >
                开始对话
              </button>
              <button 
                className="hero-btn secondary" 
                onClick={() => {
                  document.querySelector('.features-section').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                了解更多
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-avatar">
              <div className="avatar-glow"></div>
              <div className="avatar-content">
                <div className="avatar-face">😊</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">核心功能</div>
            <h3>我们提供全方位的情感陪伴解决方案</h3>
            <p className="section-description">满足您的各种情感需求，让AI成为您最贴心的伙伴</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={feature.id} 
                className={`feature-card${feature.route ? ' feature-clickable' : ''}`}
                ref={(el) => (featureRefs.current[index] = el)}
                onClick={() => feature.route && navigate(feature.route)}
                style={feature.route ? { cursor: 'pointer' } : undefined}
              >
                <div className={`feature-icon ${feature.color}`}>{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 优势展示 */}
      <section className="advantages-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">为什么选择我们</div>
            <h3>我们的系统具有显著的优势</h3>
            <p className="section-description">让您的情感陪伴体验更加优质和高效</p>
          </div>
          <div className="advantages-grid">
            {advantages.map((item, index) => (
              <div key={index} className="advantage-card">
                <div className="advantage-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 统计信息 */}
      <section className="stats-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">用户数据</div>
            <h3>我们的影响力</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">活跃用户</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100,000+</div>
              <div className="stat-label">对话次数</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">用户满意度</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">随时陪伴</div>
            </div>
          </div>
        </div>
      </section>

      {/* 底部行动区 */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h3>开始您的AI情感陪伴之旅</h3>
            <p>与语你相伴一起，探索更多可能性，让AI成为您生活中的得力助手</p>
            <button 
              className="cta-btn" 
              onClick={() => navigate('/home/chat')}
            >
              立即开始
            </button>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h2>语你相伴</h2>
              <p>您的AI数字伙伴，随时为您提供陪伴和支持</p>
            </div>
            <div className="footer-links">
              <div className="footer-link-group">
                <h4>功能</h4>
                <ul>
                  <li><a href="/home/chat">对话</a></li>
                  <li><a href="/profile">个人中心</a></li>
                </ul>
              </div>
              <div className="footer-link-group">
                <h4>关于我们</h4>
                <ul>
                  <li><a href="/#">公司简介</a></li>
                  <li><a href="/#">联系我们</a></li>
                </ul>
              </div>
              <div className="footer-link-group">
                <h4>支持</h4>
                <ul>
                  <li><a href="/#">帮助中心</a></li>
                  <li><a href="/#">隐私政策</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 语你相伴. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;