# 🎭 语你相伴 - AI情感陪护虚拟数字人

<p align="center">
    <img src="https://img.shields.io/badge/React-18-blue?logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Koa-2.15-green?logo=koa&logoColor=33333D" alt="Koa">
    <img src="https://img.shields.io/badge/Node.js-18+-brightgreen?logo=node.js&logoColor=339933" alt="Node.js">
    <img src="https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql&logoColor=4479A1" alt="MySQL">
    <img src="https://img.shields.io/badge/Zustand-5.0+-0070f3?logo=npm&logoColor=0070f3" alt="Zustand">
    <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

**本项目使用：**

<p align="center">
    <img src="https://img.shields.io/badge/React-18.0.0-61DAFB?logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Koa-2.15.0-33333D?logo=koa&logoColor=33333D" alt="Koa">
    <img src="https://img.shields.io/badge/Node.js-18.0.0-339933?logo=node.js&logoColor=339933" alt="Node.js">
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=4479A1" alt="MySQL">
    <img src="https://img.shields.io/badge/Zustand-5.0.0-0070f3?logo=npm&logoColor=0070f3" alt="Zustand">
    <img src="https://img.shields.io/badge/React_Router-6.0.0-CA4245?logo=reactrouter&logoColor=CA4245" alt="React Router">
    <img src="https://img.shields.io/badge/Axios-1.0.0-5A29E4?logo=axios&logoColor=5A29E4" alt="Axios">
</p>

> **一个面向用户的AI情感陪伴类全栈应用**，通过虚拟数字人实现情感对话交互，为用户提供温暖的陪伴体验。系统支持用户注册登录、实时情感对话、个人中心管理等功能，打造智能化的情感陪伴平台。

## ✨ 项目亮点

### 🎭 数字人情感交互
- **智能情感识别**
    - 预设5种情绪表情：开心、温柔、思考、难过、惊讶
    - 根据用户输入内容智能分析情绪
    - 情绪切换带有平滑过渡动画
    - 支持实时对话，响应迅速

- **Live2D 数字人**
    - 采用 Live2D 技术实现生动的虚拟形象
    - 支持多种动作和表情切换
    - 流畅的动画效果，提升用户体验

### 🔐 安全可靠的用户系统
- **JWT 身份认证**
    - 登录成功后签发 Token，存储于 localStorage
    - 请求时携带 Authorization 头
    - Token 过期自动跳转登录页
    - 支持无感刷新 Token

- **登录防刷机制**
    - 连续失败5次锁定账号15分钟
    - 登录成功自动清除失败记录
    - 基于 MySQL 记录，服务重启不影响

- **密码加密存储**
    - 使用 bcrypt 进行密码哈希
    - 数据库只存储加密后的密码
    - 安全性与性能平衡

### 📱 现代化前端设计
- **响应式布局**
    - 适配不同屏幕尺寸
    - 移动端友好的界面设计
    - 清晰的视觉层次

- **状态管理**
    - 使用 Zustand 轻量级状态管理
    - 模块化的状态管理架构
    - 易于维护和扩展

- **用户体验优化**
    - 头像裁剪上传功能
    - 实时消息提示
    - 流畅的页面切换动画
    - 友好的错误提示

### 🏗️ 完整架构
- **前后端分离**
    - 前端：React + React Router + Zustand
    - 后端：Koa + MySQL + JWT
    - RESTful API 设计
    - 支持跨域请求（CORS）

- **分层架构**
    - 后端：路由层 → 控制层 → 服务层 → 数据层
    - 前端：页面层 → 组件层 → 服务层 → 状态管理层
    - 模块化设计，易于扩展

## 🚀 功能特性

| 功能模块 | 描述 |
|---------|------|
| 🔐 用户系统 | 手机号/邮箱注册登录、JWT 认证、密码加密存储、登录防刷机制 |
| 🎭 数字人对话 | 虚拟数字人根据对话内容展示不同情绪表情，支持实时对话，采用 Live2D 技术实现生动形象 |
| 👤 个人中心 | 支持头像裁剪上传、昵称修改、密码修改、个人信息管理 |
| 📝 情绪日记 | 记录用户情感状态，提供情感分析和可视化展示 |
| 📊 情感分析 | 分析用户情感趋势，提供情感洞察和建议 |
| 🌐 社交分享 | 分享心情和成就，增强社交互动，支持情绪卡片生成 |
| 🔍 自我探索 | 人格测试（MBTI）、价值观探索、目标设定功能，帮助用户了解自我 |
| 🧠 思维训练 | 思维训练题目、学习进度跟踪、多种思维类型选择（批判性思维、创造性思维等） |
| 🤝 社交连接 | 虚拟朋友圈、兴趣社群、数字人社交，构建虚拟社交网络 |
| ✍️ 内容创作 | 内容生成、历史记录管理，支持多种内容类型创作 |
| 🎮 休闲互动 | 休闲游戏、互动活动，提供轻松愉快的娱乐体验 |
| 📚 知识学习 | 知识内容学习、学习进度跟踪，支持多种知识领域 |
| 🩺 健康管理 | 健康数据记录、健康建议，关注用户身心健康 |
| 📅 日常管理 | 日程安排、习惯养成，帮助用户规划和管理日常生活 |

## 🛠️ 技术栈

### 前端 (Frontend)

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.0.0 | 现代 UI 框架，函数式组件 + Hooks |
| React Router | 6.0.0 | 前端路由管理 |
| Zustand | 5.0.0 | 轻量级状态管理 |
| Axios | 1.0.0 | HTTP 请求库 |
| react-cropper | 2.0.0 | 头像裁剪组件 |
| react-hot-toast | 2.0.0 | 消息提示组件 |
| Live2D | - | 虚拟数字人技术 |

### 后端 (Backend)

| 技术 | 版本 | 用途 |
|------|------|------|
| Koa | 2.15.0 | Node.js Web 框架 |
| MySQL | 8.0 | 关系型数据库 |
| JWT | 9.0.0 | 身份认证 |
| bcrypt | 6.0.0 | 密码加密 |
| Joi | 17.0.0 | 参数校验 |
| mysql2 | 3.0.0 | MySQL 数据库连接 |
| axios | 1.0.0 | HTTP 请求库 |

## 📁 项目结构

```plaintext
EmoSoul-Companion/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── config/             # 配置（MySQL连接等）
│   │   ├── controllers/        # 控制器层
│   │   ├── middleware/         # 中间件
│   │   ├── models/             # 数据模型层
│   │   ├── routes/             # 路由层
│   │   ├── services/           # 服务层
│   │   ├── utils/              # 工具函数
│   │   └── app.js              # 应用入口
│   ├── python/                 # Python 情感分析服务
│   ├── .env.example            # 环境变量示例
│   ├── README.md               # 后端开发文档
│   └── package.json            # 后端依赖配置
│
├── frontend/                   # 前端项目
│   ├── public/                 # 静态资源
│   │   └── models/             # Live2D 模型资源
│   ├── src/
│   │   ├── assets/             # 静态资源
│   │   ├── components/         # 组件层
│   │   ├── constants/          # 常量定义
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── pages/              # 页面层
│   │   │   ├── Chat/               # 数字人对话 - 实时情感对话，Live2D数字人交互
│   │   │   ├── ContentCreation/    # 内容创作 - 内容生成、历史记录管理
│   │   │   ├── DailyManagement/    # 日常管理 - 日程安排、习惯养成
│   │   │   ├── DigitalHuman/       # 数字人管理 - 数字人设置、情绪配置
│   │   │   ├── EmotionAnalysis/    # 情感分析 - 情感趋势分析、数据可视化
│   │   │   ├── ForgotPassword/     # 忘记密码 - 密码找回功能
│   │   │   ├── HealthManagement/   # 健康管理 - 健康数据记录、健康建议
│   │   │   ├── Home/               # 首页 - 功能导航、用户概览
│   │   │   ├── KnowledgeLearning/  # 知识学习 - 知识内容学习、学习进度跟踪
│   │   │   ├── LeisureInteraction/ # 休闲互动 - 休闲游戏、互动活动
│   │   │   ├── Login/              # 登录 - 用户登录、JWT认证
│   │   │   ├── Profile/            # 个人中心 - 个人信息管理、头像上传
│   │   │   ├── Register/           # 注册 - 用户注册、密码加密
│   │   │   ├── ResetPassword/      # 重置密码 - 密码修改功能
│   │   │   ├── SelfExploration/    # 自我探索 - 人格测试、价值观探索、目标设定
│   │   │   ├── Share/              # 分享功能 - 心情分享、情绪卡片生成
│   │   │   ├── SocialConnection/   # 社交连接 - 虚拟朋友圈、兴趣社群、数字人社交
│   │   │   └── ThinkingTraining/   # 思维训练 - 思维训练题目、学习进度跟踪
│   │   ├── services/           # API 服务
│   │   ├── store/              # 状态管理
│   │   ├── styles/             # 样式
│   │   ├── utils/              # 工具函数
│   │   ├── App.jsx             # 应用入口
│   │   └── index.js            # 前端入口
│   ├── README.md               # 前端开发文档
│   └── package.json            # 前端依赖配置
│
├── Dockerfile                    # Docker 构建文件
├── docker-compose.yml            # Docker Compose 配置（含 MySQL）
├── docker-compose.mysql-dev.yml  # MySQL 开发环境配置
├── nginx.conf                    # Nginx 配置
├── README.md                     # 项目文档
└── .gitignore                    # Git 忽略文件
```

## 🏃 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0
- npm 或 yarn
- Docker (可选)

### 1. 克隆项目
```bash
git clone https://github.com/harvest0623/EmoSoul-Companion.git
cd EmoSoul-Companion
```

### 2. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE yu_ni_xiang_ban CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. 启动后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置数据库密码等配置

# 启动服务
npm run dev
```

后端启动在 http://localhost:3001

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端启动在 http://localhost:3000

### Docker 一键启动

```bash
# 启动应用+MySQL
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 🔍 核心实现原理

### 1. JWT 认证机制

**后端 - 登录成功生成 Token**

```javascript
// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');

async function login(ctx) {
    const { username, password } = ctx.request.body;
    
    // 验证用户存在
    const user = await userService.findUserByUsername(username);
    if (!user) {
        ctx.status = 400;
        ctx.body = { message: '账号不存在' };
        return;
    }

    // 验证密码
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        ctx.status = 400;
        ctx.body = { message: '密码错误' };
        return;
    }

    // 生成 JWT Token
    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    ctx.body = {
        code: 1,
        message: '登录成功',
        token,
        user: { id: user.id, username: user.username, nickname: user.nickname }
    };
}
```

**后端 - Token 验证中间件**

```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

function verifyToken() {
    return async (ctx, next) => {
        const token = ctx.request.header.authorization;
        
        if (!token) {
            ctx.status = 401;
            ctx.body = { code: 0, message: '请先登录' };
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ctx.userId = decoded.id;
            ctx.username = decoded.username;
            await next();
        } catch (error) {
            ctx.status = 401;
            ctx.body = { code: 0, message: 'token 无效' };
        }
    };
}
```

### 2. 数字人情绪系统

**前端 - Live2D 数字人组件**

```jsx
// frontend/src/components/Live2DAvatar/index.jsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import * as live2d from 'pixi-live2d-display';
import './Live2DAvatar.css';

export default function Live2DAvatar({ emotion = 'neutral' }) {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        // 初始化 Live2D 数字人
        // 根据情绪切换不同的动作和表情
    }, [emotion]);
    
    return <canvas ref={canvasRef} className="live2d-avatar" />;
}
```

### 3. 头像裁剪功能

**前端 - 头像裁剪组件**

```jsx
// frontend/src/components/AvatarCropper/index.jsx
import React, { useState } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './AvatarCropper.css';

export default function AvatarCropper({ onCrop }) {
    const [image, setImage] = useState(null);
    const cropperRef = React.useRef(null);
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCrop = () => {
        if (cropperRef.current) {
            const cropper = cropperRef.current.cropper;
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob((blob) => {
                onCrop(blob);
            });
        }
    };
    
    return (
        <div className="avatar-cropper">
            <input type="file" onChange={handleFileChange} />
            {image && (
                <>
                    <Cropper
                        ref={cropperRef}
                        src={image}
                        style={{ height: 400, width: '100%' }}
                        aspectRatio={1}
                        viewMode={1}
                    />
                    <button onClick={handleCrop}>确认裁剪</button>
                </>
            )}
        </div>
    );
}
```

### 4. 登录防刷机制

**后端 - 登录防刷中间件**

```javascript
// backend/src/middleware/loginLimiter.js
const loginAttempts = new Map();

function loginLimiter() {
    return async (ctx, next) => {
        const { username } = ctx.request.body;
        const attempts = loginAttempts.get(username) || 0;
        
        if (attempts >= 5) {
            ctx.status = 429;
            ctx.body = { message: '登录失败次数过多，请15分钟后再试' };
            return;
        }
        
        await next();
        
        // 登录失败，增加失败次数
        if (ctx.status === 400 && ctx.body.message === '密码错误') {
            loginAttempts.set(username, attempts + 1);
            // 15分钟后清除失败记录
            setTimeout(() => {
                loginAttempts.delete(username);
            }, 15 * 60 * 1000);
        }
        
        // 登录成功，清除失败记录
        if (ctx.status === 200 && ctx.body.code === 1) {
            loginAttempts.delete(username);
        }
    };
}
```

### 5. 自我探索功能

**前端 - 人格测试实现**

```jsx
// frontend/src/pages/SelfExploration/index.jsx
const personalityQuestions = [
    {
        id: 1,
        question: '在社交场合中，你通常会：',
        options: [
        { text: '主动与很多人交流', value: 'E' },
        { text: '只与少数熟悉的人交谈', value: 'I' }
        ]
    },
    {
        id: 2,
        question: '你更关注：',
        options: [
        { text: '具体的事实和细节', value: 'S' },
        { text: '整体的模式和可能性', value: 'N' }
        ]
    },
    // 更多问题...
];

const calculateResult = () => {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.values(answers).forEach(value => {
        counts[value]++;
    });

    const personality = 
        (counts.E >= counts.I ? 'E' : 'I') +
        (counts.S >= counts.N ? 'S' : 'N') +
        (counts.T >= counts.F ? 'T' : 'F') +
        (counts.J >= counts.P ? 'J' : 'P');

    // 保存结果到本地存储
    const resultData = {
        type: personality,
        ...personalityDescriptions[personality],
        date: new Date().toISOString()
    };

    setResult(resultData);
    localStorage.setItem('selfExplorationPersonality', JSON.stringify(resultData));
};
```

### 6. 思维训练功能

**前端 - 思维训练实现**

```jsx
// frontend/src/pages/ThinkingTraining/index.jsx
const [selectedCategory, setSelectedCategory] = useState('critical');
const [progress, setProgress] = useState(0);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [answers, setAnswers] = useState({});

const categories = [
    { id: 'critical', name: '批判性思维', icon: '🧠' },
    { id: 'creative', name: '创造性思维', icon: '💡' },
    { id: 'problem-solving', name: '问题解决', icon: '🔍' },
    { id: 'logical', name: '逻辑推理', icon: '🔢' }
];

// 学习进度计算
useEffect(() => {
    // 模拟学习进度
    setProgress(65);
}, []);

// 回答问题
const answerQuestion = (value) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [question.id]: value }));

    if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
    } else {
        // 完成训练
        completeTraining();
    }
};
```

### 7. 社交连接功能

**前端 - 社交连接实现**

```jsx
// frontend/src/pages/SocialConnection/index.jsx
const [activeTab, setActiveTab] = useState('friends');
const [posts, setPosts] = useState([]);
const [newPost, setNewPost] = useState('');
const [communities, setCommunities] = useState([]);
const [selectedCommunity, setSelectedCommunity] = useState(null);

const createPost = () => {
    if (!newPost.trim()) return;
    
    const post = {
        id: Date.now(),
        content: newPost,
        author: '我',
        avatar: '👤',
        time: new Date().toLocaleString(),
        likes: 0,
        comments: 0
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
};

const joinCommunity = (communityId) => {
    setCommunities(prev => prev.map(community => 
        community.id === communityId 
        ? { ...community, joined: true } 
        : community
    ));
};
```

### 8. 内容创作功能

**前端 - 内容创作实现**

```jsx
// frontend/src/pages/ContentCreation/index.jsx
const [activeTab, setActiveTab] = useState('story');
const [content, setContent] = useState('');
const [history, setHistory] = useState([]);

const generateContent = async () => {
    // 模拟内容生成
    const generatedContent = "这是生成的内容...";
    setContent(generatedContent);
    
    // 保存到历史记录
    const historyItem = {
        id: Date.now(),
        type: activeTab,
        content: generatedContent,
        timestamp: new Date().toISOString()
    };
    setHistory([historyItem, ...history]);
};
```

## 🧩 开发指南

### 添加新页面

1. **创建页面文件夹**：在 `frontend/src/pages/` 下创建页面文件夹，包含 `index.jsx` 和对应的 CSS 文件
2. **添加路由配置**：在 `frontend/src/App.jsx` 中添加路由配置，确保路由路径与页面功能匹配
3. **实现页面结构**：
   - 使用 React 函数式组件
   - 添加页面特定的类名，避免样式冲突
   - 实现页面布局和基本结构
4. **添加状态管理**：
   - 使用 React useState 和 useEffect 钩子
   - 对于复杂状态，考虑使用 Zustand 进行全局状态管理
5. **实现用户交互**：
   - 添加事件处理函数
   - 实现表单提交和数据处理
   - 添加动画和过渡效果
6. **支持暗黑模式**：
   - 使用 CSS 变量或条件类名实现暗黑模式
   - 确保所有元素在暗黑模式下都有良好的显示效果
7. **测试和优化**：
   - 测试页面在不同设备上的显示效果
   - 优化页面性能和用户体验

### 添加新接口

1. **创建控制器**：在 `backend/src/controllers/` 下创建控制器，处理请求逻辑
2. **创建服务**：在 `backend/src/services/` 下创建服务，实现业务逻辑
3. **注册路由**：在 `backend/src/routes/index.js` 中注册路由，定义 API 路径
4. **添加中间件**：根据需要添加认证、日志等中间件
5. **测试接口**：使用 Postman 或其他工具测试接口功能

### 数据库操作

```javascript
// backend/src/models/userModel.js
const db = require('../config/database');

class UserModel {
    async findByUsername(username) {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }
    
    async create(userData) {
        const [result] = await db.execute(
            'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
            [userData.username, userData.password, userData.nickname]
        );
        return result;
    }
    
    async update(id, userData) {
        const [result] = await db.execute(
            'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
            [userData.nickname, userData.avatar, id]
        );
        return result;
    }
}

export default new UserModel();
```

### 样式开发

1. **使用 CSS 模块化**：为每个页面创建独立的 CSS 文件
2. **使用 CSS 变量**：定义颜色、字体等变量，方便主题切换
3. **响应式设计**：使用媒体查询适配不同屏幕尺寸
4. **动画效果**：添加适当的动画和过渡效果，提升用户体验
5. **暗黑模式**：实现支持暗黑模式的样式

### 状态管理

1. **局部状态**：使用 React useState 管理组件内部状态
2. **全局状态**：使用 Zustand 管理跨组件的全局状态
3. **状态持久化**：使用 localStorage 或 sessionStorage 持久化状态
4. **状态更新**：使用不可变数据模式更新状态，避免直接修改状态

### 性能优化

1. **组件优化**：使用 React.memo 和 useCallback 优化组件渲染
2. **数据优化**：合理使用 useEffect 依赖项，避免不必要的重渲染
3. **资源优化**：优化图片和其他静态资源
4. **网络优化**：使用缓存和请求合并优化网络请求

### 代码规范

1. **命名规范**：使用语义化的变量和函数名
2. **代码风格**：保持一致的代码风格，使用 ESLint 进行代码检查
3. **注释规范**：添加适当的注释，提高代码可读性
4. **文件结构**：保持清晰的文件结构，便于维护和扩展

## 📦 依赖说明

### 前端依赖
- **React** & **React DOM**：现代 UI 框架核心
- **React Router**：前端路由管理
- **Zustand**：轻量级状态管理
- **Axios**：HTTP 请求库
- **react-cropper**：头像裁剪组件
- **react-hot-toast**：消息提示组件
- **Live2D**：虚拟数字人技术

### 后端依赖
- **Koa**：Node.js Web 框架
- **MySQL2**：MySQL 数据库连接
- **JWT**：身份认证
- **bcrypt**：密码加密
- **Joi**：参数校验
- **axios**：HTTP 请求库

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/YourFeature`
3. 提交更改：`git commit -m 'Add some YourFeature'`
4. 推送到分支：`git push origin feature/YourFeature`
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 📞 联系方式

- GitHub Issues: [提交问题](https://github.com/harvest0623/EmoSoul-Companion/issues)
- 邮箱：3367741939@qq.com or harvest060523@gmail.com

---

**如果这个项目对你有帮助，欢迎给一个 ⭐ Star！**

> 🎭 语你相伴，用科技传递温暖，让陪伴更有温度