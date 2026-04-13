import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AvatarCropper from '../../components/AvatarCropper';
import { userApi } from '../../services/userService';
import { authApi } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { validator } from '../../utils/validator';
import './Profile.css';

// 引入图标字体
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '//at.alicdn.com/t/c/font_5158834_g48mg3g9h7b.css';
document.head.appendChild(link);

/**
 * 个人中心页面
 */
const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [cropImage, setCropImage] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);

  // 从全局主题状态获取
  const { darkMode, toggleDarkMode } = useThemeStore();

  // 初始化用户信息
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // 加载最新用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const result = await userApi.getProfile();
        if (result.code === 200) {
          updateUser(result.data);
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    };
    
    loadUserInfo();
  }, [updateUser]);

  // 修改昵称
  const handleUpdateNickname = async () => {
    const validation = validator.validateNickname(nickname);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    if (nickname === user?.nickname) {
      setIsEditingNickname(false);
      return;
    }

    setLoading(true);
    try {
      const result = await userApi.updateNickname(nickname);
      if (result.code === 200) {
        updateUser({ nickname: result.data.nickname });
        toast.success('昵称修改成功');
        setIsEditingNickname(false);
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 触发文件选择
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    // 读取文件并显示裁剪器
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
    };
    reader.readAsDataURL(file);

    // 清空input，允许重复选择同一文件
    e.target.value = '';
  };

  // 处理裁剪完成
  const handleCropComplete = async (croppedImage) => {
    setCropImage(null);
    setLoading(true);
    
    try {
      const result = await userApi.updateAvatar(croppedImage);
      if (result.code === 200) {
        updateUser({ avatar: result.data.avatar });
        setAvatar(croppedImage);
        toast.success('头像更新成功');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleUpdatePassword = async () => {
    if (!passwordForm.oldPassword) {
      toast.error('请输入原密码');
      return;
    }

    const validation = validator.validatePassword(passwordForm.newPassword);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);
    try {
      const result = await userApi.updatePassword(
        passwordForm.oldPassword,
        passwordForm.newPassword
      );
      if (result.code === 200) {
        toast.success('密码修改成功，请重新登录');
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '' });
        // 退出登录
        handleLogout();
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // 忽略退出接口的错误
    } finally {
      logout();
      toast.success('已退出登录');
      navigate('/login');
    }
  };

  return (
    <div className={`profile-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="profile-header">
        <div className="header-brand">
          <h1>语你相伴</h1>
        </div>
        <nav className="header-nav">
          <button className="nav-btn" onClick={() => navigate('/')}>
            对话
          </button>
          <button className="nav-btn active">我的</button>
          <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
            <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
          </button>
        </nav>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          {/* 头像区域 */}
          <div className="profile-avatar-section">
            <div className="avatar-upload" onClick={handleAvatarClick}>
              {avatar ? (
                <img src={avatar} alt="头像" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.nickname?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="avatar-overlay">
                <span>更换头像</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p className="avatar-hint">点击更换头像（支持 JPG/PNG，最大 2MB）</p>
          </div>

          {/* 信息表单 */}
          <div className="profile-form">
            {/* 账号 */}
            <div className="profile-field">
              <div className="field-value read-only">
                <span className="field-icon iconfont icon-dianhua"></span>
                <span>{user?.account || '-'}</span>
                <span className="field-tag">不可修改</span>
              </div>
            </div>

            {/* 昵称 */}
            <div className="profile-field">
              {isEditingNickname ? (
                <div className="field-edit">
                  <div className="input-with-icon">
                    <span className="input-icon iconfont icon-zhanghao"></span>
                    <input
                      type="text"
                      className="input"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={16}
                      autoFocus
                    />
                  </div>
                  <div className="field-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditingNickname(false);
                        setNickname(user?.nickname || '');
                      }}
                    >
                      取消
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleUpdateNickname}
                      disabled={loading}
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div className="field-value">
                  <span className="field-icon iconfont icon-zhanghao"></span>
                  <span>{user?.nickname || '-'}</span>
                  <button 
                    className="edit-btn"
                    onClick={() => setIsEditingNickname(true)}
                  >
                    修改
                  </button>
                </div>
              )}
            </div>

            {/* 注册时间 */}
            <div className="profile-field">
              <div className="field-value read-only">
                <span className="field-label">注册时间</span>
                <span>
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('zh-CN')
                    : '-'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="profile-actions">
            <button 
              className="btn btn-secondary action-btn"
              onClick={() => setShowPasswordModal(true)}
            >
              <span className="btn-icon iconfont icon-mima"></span>
              修改密码
            </button>
            <button 
              className="btn btn-secondary action-btn logout-btn"
              onClick={handleLogout}
            >
              <span className="btn-icon iconfont icon-tuichudenglu"></span>
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 头像裁剪弹窗 */}
      {cropImage && (
        <AvatarCropper
          image={cropImage}
          onCrop={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>修改密码</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>原密码</label>
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-mima"></span>
                  <input
                    type="password"
                    className="input"
                    placeholder="请输入原密码"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      oldPassword: e.target.value
                    }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>新密码</label>
                <div className="input-with-icon">
                  <span className="input-icon iconfont icon-mima"></span>
                  <input
                    type="password"
                    className="input"
                    placeholder="至少8位，包含字母和数字/特殊字符"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '' });
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpdatePassword}
                disabled={loading}
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
