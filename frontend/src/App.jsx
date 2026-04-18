import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import './styles/global.css';

// 页面组件
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import HealthManagement from './pages/HealthManagement';
import DailyManagement from './pages/DailyManagement';
import Todo from './pages/Todo';
import Social from './pages/Social';
import Achievement from './pages/Achievement';
import EmotionAnalysis from './pages/EmotionAnalysis';
import DigitalHuman from './pages/DigitalHuman';
import ContentCreation from './pages/ContentCreation';

/**
 * 受保护的路由组件
 */
const ProtectedRoute = ({ children, path }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  
  console.log('ProtectedRoute - Path:', path, 'Authenticated:', isAuthenticated, 'Initializing:', isInitializing);
  
  // 认证状态初始化完成之前，不进行重定向
  if (isInitializing) {
    console.log('ProtectedRoute - Initializing, waiting...');
    return null; // 或者返回一个加载状态
  }
  
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute - Allowing access');
  return children;
};

/**
 * 已登录用户重定向
 */
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  
  console.log('RedirectIfAuthenticated - Authenticated:', isAuthenticated, 'Initializing:', isInitializing);
  
  // 认证状态初始化完成之前，不进行重定向
  if (isInitializing) {
    console.log('RedirectIfAuthenticated - Initializing, waiting...');
    return null; // 或者返回一个加载状态
  }
  
  if (isAuthenticated) {
    console.log('RedirectIfAuthenticated - Redirecting to home');
    return <Navigate to="/home" replace />;
  }
  
  console.log('RedirectIfAuthenticated - Allowing access');
  return children;
};

// 滚动到顶部组件
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * 主应用组件
 */
function App() {
  const { init } = useAuthStore();

  // 初始化认证状态
  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <ScrollToTop />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 24px',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      
      <Routes>
        {/* 登录页面 */}
        <Route 
          path="/login" 
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          } 
        />
        
        {/* 注册页面 */}
        <Route 
          path="/register" 
          element={
            <RedirectIfAuthenticated>
              <Register />
            </RedirectIfAuthenticated>
          } 
        />
        
        {/* 忘记密码页面 */}
        <Route 
          path="/forgot-password" 
          element={
            <RedirectIfAuthenticated>
              <ForgotPassword />
            </RedirectIfAuthenticated>
          } 
        />
        
        {/* 密码重置页面 */}
        <Route 
          path="/reset-password" 
          element={
            <RedirectIfAuthenticated>
              <ResetPassword />
            </RedirectIfAuthenticated>
          } 
        />
        
        {/* 首页 - 需要登录 */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute path="/home">
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* 聊天页面 - 需要登录 */}
        <Route 
          path="/home/chat" 
          element={
            <ProtectedRoute path="/home/chat">
              <Chat />
            </ProtectedRoute>
          } 
        />
        
        {/* 健康管理 - 需要登录 */}
        <Route 
          path="/home/health-management" 
          element={
            <ProtectedRoute path="/home/health-management">
              <HealthManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* 日常管理 - 需要登录 */}
        <Route 
          path="/home/daily-management" 
          element={
            <ProtectedRoute path="/home/daily-management">
              <DailyManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* 个人中心 - 需要登录 */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute path="/profile">
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* 待办事项 - 需要登录 */}
        <Route path="/todo" element={<ProtectedRoute path="/todo"><Todo /></ProtectedRoute>} />
        
        {/* 社交动态 - 需要登录 */}
        <Route path="/social" element={<ProtectedRoute path="/social"><Social /></ProtectedRoute>} />
        
        {/* 成就系统 - 需要登录 */}
        <Route path="/achievements" element={<ProtectedRoute path="/achievements"><Achievement /></ProtectedRoute>} />
        
        {/* 数字人 - 需要登录 */}
        <Route
          path="/home/digital-human"
          element={
            <ProtectedRoute path="/home/digital-human">
              <DigitalHuman />
            </ProtectedRoute>
          }
        />
        
        {/* 情绪识别与反馈 - 需要登录 */}
        <Route 
          path="/home/emotion-analysis" 
          element={
            <ProtectedRoute path="/home/emotion-analysis">
              <EmotionAnalysis />
            </ProtectedRoute>
          } 
        />
        
        {/* 内容创作 - 需要登录 */}
        <Route 
          path="/content-creation" 
          element={
            <ProtectedRoute path="/content-creation">
              <ContentCreation />
            </ProtectedRoute>
          } 
        />
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;