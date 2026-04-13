import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import './styles/global.css';

// 页面组件
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

/**
 * 受保护的路由组件
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isHydrated } = useAuthStore();
  
  if (!isHydrated) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * 已登录用户重定向
 */
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, isHydrated } = useAuthStore();
  
  if (!isHydrated) {
    return null;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
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
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* 个人中心 - 需要登录 */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
