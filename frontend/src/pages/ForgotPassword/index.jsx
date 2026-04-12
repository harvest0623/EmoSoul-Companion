import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authService';
import { validator } from '../../utils/validator';
import './ForgotPassword.css';

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
link.href = '//at.alicdn.com/t/c/font_5158834_czcc22vhf94.css';
document.head.appendChild(link);

/**
 * 忘记密码页面
 */
const ForgotPassword = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        account: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const result = await authApi.forgotPassword({
                account: formData.account
            });

            if (result.code === 200) {
                setSuccess(true);
                toast.success('重置链接已发送到您的邮箱');
            }
        } catch (error) {
            // 错误已在拦截器中处理
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <div className="forgot-password-header">
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

                <div className="forgot-password-card">
                    {!success ? (
                        <>
                            <h2>忘记密码</h2>
                            <p className="forgot-password-subtitle">请输入您的账号，我们将发送重置链接到您的邮箱</p>

                            <form onSubmit={handleSubmit} className="forgot-password-form">
                                <div className="form-group">
                                    <label>账号</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon iconfont icon-mima"></span>
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

                                <button
                                    type="submit"
                                    className="btn btn-primary forgot-password-btn"
                                    disabled={loading}
                                >
                                    {loading ? '发送中...' : '发送重置链接'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="success-message">
                            <div className="success-icon">✓</div>
                            <h3>重置链接已发送</h3>
                            <p>请检查您的邮箱，点击邮件中的链接重置密码</p>
                            <p className="note">链接将在24小时内失效</p>
                            <Link to="/login" className="back-to-login">返回登录</Link>
                        </div>
                    )}

                    <div className="forgot-password-footer">
                        <p>想起密码了？ <Link to="/login">立即登录</Link></p>
                        <p>还没有账号？ <Link to="/register">立即注册</Link></p>
                    </div>
                </div>

                <div className="forgot-password-decoration">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="floating-shape shape-3"></div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;