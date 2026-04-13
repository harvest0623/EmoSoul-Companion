import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { validator } from '../../utils/validator';
import './Login.css';

// 直接使用相对路径
const avatarSurprised = require('../../assets/images/avatar-surprised.png');
const avatarSad = require('../../assets/images/avatar-sad.png');
const avatarThinking = require('../../assets/images/avatar-thinking.png');

// 所有头像图片
const avatars = {
  surprised: avatarSurprised,
  sad: avatarSad,
  thinking: avatarThinking
};

// 引入图标字体
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '//at.alicdn.com/t/c/font_5158834_g48mg3g9h7b.css';
document.head.appendChild(link);

/**
 * 登录页面
 */
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    account: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('surprised');
  
  // 切换头像
  const switchAvatar = () => {
    const avatarKeys = Object.keys(avatars);
    const currentIndex = avatarKeys.indexOf(currentAvatar);
    const nextIndex = (currentIndex + 1) % avatarKeys.length;
    setCurrentAvatar(avatarKeys[nextIndex]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    const accountValidation = validator.validateAccount(formData.account);
    if (!accountValidation.valid) {
      newErrors.account = accountValidation.message;
    }
    
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const result = await authApi.login({
        account: formData.account,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      
      if (result.code === 200) {
        login(result.data.user, result.data.token);
        toast.success('登录成功');
        navigate('/');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* 左侧品牌区域 */}
        <div className="login-brand">
          <div className="brand-content">
            <h2 className="brand-title">情感陪护，温暖相伴</h2>
            <p className="brand-subtitle">让AI成为您的心灵伙伴，随时随地为您提供情感支持和陪伴</p>
            
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span className="feature-text">实时情感分析，理解您的情绪状态</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤗</span>
                <span className="feature-text">个性化对话，提供专属情感支持</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌟</span>
                <span className="feature-text">多场景陪伴，适应不同情绪需求</span>
              </div>
            </div>
            
            <div className="brand-tags">
              <span className="brand-tag">AI情感分析</span>
              <span className="brand-tag">智能陪伴</span>
              <span className="brand-tag">心灵守护</span>
              <span className="brand-tag">24小时在线</span>
            </div>
          </div>
        </div>
        
        {/* 右侧登录区域 */}
        <div className="login-form-container">
          <div className="login-header">
            <div className="brand-container">
              <div className="brand-avatar" onClick={switchAvatar} title="点击切换头像">
                <img src={avatars[currentAvatar]} alt="数字人" className="avatar-img" />
              </div>
              <div className="brand-text">
                <h1>语你相伴</h1>
                <p>AI情感陪护虚拟数字人</p>
              </div>
            </div>
          </div>
          
          <div className="login-card">
            <h2>欢迎回来</h2>
            <p className="login-subtitle">登录您的账号，开启陪伴之旅</p>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-zhanghao"></span>
                  <input
                    type="text"
                    name="account"
                    className={`input ${errors.account ? 'input-error' : ''}`}
                    placeholder="请输入手机号或邮箱"
                    value={formData.account}
                    onChange={handleChange}
                  />
                </div>
                {errors.account && <span className="error-text">{errors.account}</span>}
              </div>
              
              <div className="form-group">
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-mima"></span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="请输入密码"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>记住我</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">忘记密码？</Link>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
            
            {/* 第三方登录 */}
            <div className="third-party-login">
              <div className="divider">
                <span>或使用以下方式登录</span>
              </div>
              <div className="third-party-buttons">
                <button 
                  className="third-party-btn qq"
                  onClick={() => alert('QQ登录功能开发中')}
                >
                  <i className="iconfont icon-QQ"></i>
                </button>
                <button 
                  className="third-party-btn wechat"
                  onClick={() => alert('微信登录功能开发中')}
                >
                  <i className="iconfont icon-weixin"></i>
                </button>
                <button 
                  className="third-party-btn weibo"
                  onClick={() => alert('微博登录功能开发中')}
                >
                  <i className="iconfont icon-xinlangweibo"></i>
                </button>
              </div>
            </div>
            
            <div className="login-footer">
              <p>还没有账号？ <Link to="/register">立即注册</Link></p>
            </div>
          </div>
        </div>
        
        <div className="login-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
