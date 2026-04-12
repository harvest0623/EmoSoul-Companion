import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authService';
import { validator } from '../../utils/validator';
import './ResetPassword.css';

/**
 * 密码重置页面
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');
  const account = searchParams.get('account');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    message: '',
    suggestions: []
  });

  useEffect(() => {
    // 验证token是否存在
    if (!token || !account) {
      setTokenValid(false);
    }
  }, [token, account]);

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
      case 4:
        message = '强';
        break;
      default:
        message = '弱';
    }
    
    return { strength, message, suggestions };
  };

  const validateForm = () => {
    const newErrors = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const result = await authApi.resetPassword({
        token,
        account,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      if (result.code === 200) {
        setSuccess(true);
        toast.success('密码重置成功');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="error-message">
              <div className="error-icon">!</div>
              <h3>链接无效或已过期</h3>
              <p>请重新申请密码重置</p>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/forgot-password')}
              >
                重新申请
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h1>语你相伴</h1>
          <p>AI情感陪护虚拟数字人</p>
        </div>
        
        <div className="reset-password-card">
          {!success ? (
            <>
              <h2>重置密码</h2>
              <p className="reset-password-subtitle">请设置新的密码</p>
              
              <form onSubmit={handleSubmit} className="reset-password-form">
                <div className="form-group">
                  <label>新密码</label>
                  <input
                    type="password"
                    name="password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="至少8位，包含字母和数字/特殊字符"
                    value={formData.password}
                    onChange={handleChange}
                  />
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
                  <label>确认密码</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="请再次输入新密码"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary reset-password-btn"
                  disabled={loading}
                >
                  {loading ? '重置中...' : '重置密码'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>密码重置成功</h3>
              <p>您的密码已成功重置，请使用新密码登录</p>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/login')}
              >
                立即登录
              </button>
            </div>
          )}
        </div>
        
        <div className="reset-password-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;