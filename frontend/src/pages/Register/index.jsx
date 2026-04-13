import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authService';
import { validator } from '../../utils/validator';
import './Register.css';

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
 * 注册页面
 */
const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    account: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0, // 0-3 (弱-中-强)
    message: '',
    suggestions: []
  });
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
    
    const passwordValidation = validator.validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }
    
    const confirmValidation = validator.validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );
    if (!confirmValidation.valid) {
      newErrors.confirmPassword = confirmValidation.message;
    }
    
    const nicknameValidation = validator.validateNickname(formData.nickname);
    if (!nicknameValidation.valid) {
      newErrors.nickname = nicknameValidation.message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 计算密码强度
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    const suggestions = [];
    
    if (password.length >= 8) {
      strength += 1;
    } else {
      suggestions.push('密码长度至少8位');
    }
    
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength += 1;
    } else if (/[a-zA-Z]/.test(password)) {
      suggestions.push('添加大小写字母组合');
    } else {
      suggestions.push('添加字母');
    }
    
    if (/\d/.test(password)) {
      strength += 1;
    } else {
      suggestions.push('添加数字');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    } else {
      suggestions.push('添加特殊字符');
    }
    
    let message = '';
    switch (strength) {
      case 0:
      case 1:
        message = '弱';
        break;
      case 2:
        message = '中';
        break;
      case 3:
        message = '强';
        break;
      case 4:
        message = '超强';
        break;
      default:
        message = '弱';
    }
    
    return { strength, message, suggestions };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // 计算密码强度
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const result = await authApi.register({
        account: formData.account,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        nickname: formData.nickname
      });
      
      if (result.code === 200) {
        toast.success('注册成功，请登录');
        navigate('/login');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* 左侧品牌区域 */}
        <div className="register-brand">
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
        
        {/* 右侧注册区域 */}
        <div className="register-form-container">
          <div className="register-header">
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
          
          <div className="register-card">
            <h2>创建账号</h2>
            <p className="register-subtitle">填写以下信息，开启您的陪伴之旅</p>
            
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-dianhua"></span>
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
                  <span className="input-icon iconfont icon-zhanghao"></span>
                  <input
                    type="text"
                    name="nickname"
                    className={`input ${errors.nickname ? 'input-error' : ''}`}
                    placeholder="请输入昵称（2-16个字符）"
                    value={formData.nickname}
                    onChange={handleChange}
                  />
                </div>
                {errors.nickname && <span className="error-text">{errors.nickname}</span>}
              </div>
              
              <div className="form-group">
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-mima"></span>
                  <input
                    type="password"
                    name="password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="至少8位，包含字母和数字/特殊字符"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-meter">
                      <div 
                        className={`strength-bar ${passwordStrength.strength === 0 ? 'weak' : passwordStrength.strength === 1 ? 'weak' : passwordStrength.strength === 2 ? 'medium' : 'strong'}`}
                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                      ></div>
                    </div>
                    <div className="strength-info">
                      <span className={`strength-text ${passwordStrength.strength === 0 ? 'weak' : passwordStrength.strength === 1 ? 'weak' : passwordStrength.strength === 2 ? 'medium' : 'strong'}`}>
                        密码强度：{passwordStrength.message}
                      </span>
                      {passwordStrength.suggestions.length > 0 && (
                        <div className="strength-suggestions">
                          {passwordStrength.suggestions.map((suggestion, index) => (
                            <span key={index} className="suggestion-item">• {suggestion}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-mima"></span>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary register-btn"
                disabled={loading}
              >
                {loading ? '注册中...' : '注册'}
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
            
            <div className="register-footer">
              <p>已有账号？ <Link to="/login">立即登录</Link></p>
            </div>
          </div>
        </div>
        
        <div className="register-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
