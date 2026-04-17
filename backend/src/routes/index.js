const Router = require('koa-router');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const ChatController = require('../controllers/chatController');
const EmotionDiaryController = require('../controllers/emotionDiaryController');
const authMiddleware = require('../middleware/auth');
const validateMiddleware = require('../middleware/validator');
const loginLimiter = require('../middleware/loginLimiter');
const { schemas } = require('../utils/validator');

const router = new Router({
    prefix: '/api'
});

// 健康检查
router.get('/health', (ctx) => {
    ctx.body = {
        code: 200,
        message: '服务运行正常',
        timestamp: new Date().toISOString()
    };
});

/**
 * 认证相关路由
 */
router.post(
    '/auth/register',
    validateMiddleware(schemas.register),
    AuthController.register
);

router.post(
    '/auth/login',
    validateMiddleware(schemas.login),
    loginLimiter,
    AuthController.login
);

router.post(
    '/auth/logout',
    authMiddleware,
    AuthController.logout
);

router.post(
    '/auth/refresh',
    authMiddleware,
    AuthController.refreshToken
);

/**
 * 用户相关路由
 */
router.get(
    '/user/profile',
    authMiddleware,
    UserController.getProfile
);

router.put(
    '/user/nickname',
    authMiddleware,
    validateMiddleware(schemas.updateNickname),
    UserController.updateNickname
);

router.put(
    '/user/avatar',
    authMiddleware,
    UserController.updateAvatar
);

router.put(
    '/user/password',
    authMiddleware,
    validateMiddleware(schemas.updatePassword),
    UserController.updatePassword
);

router.get(
    '/user/companion',
    authMiddleware,
    UserController.getCompanionSettings
);

router.put(
    '/user/companion',
    authMiddleware,
    UserController.updateCompanionSettings
);

/**
 * 对话相关路由
 */
router.post(
    '/chat/message',
    authMiddleware,
    validateMiddleware(schemas.chatMessage),
    ChatController.sendMessage
);

router.get(
    '/chat/history',
    authMiddleware,
    ChatController.getHistory
);

router.get(
    '/chat/poll',
    authMiddleware,
    ChatController.pollMessages
);

router.delete(
    '/chat/history',
    authMiddleware,
    ChatController.clearHistory
);

/**
 * 情绪日记相关路由
 */
router.get('/diary', authMiddleware, EmotionDiaryController.getDiary);
router.post('/diary', authMiddleware, EmotionDiaryController.createEntry);
router.get('/diary/stats', authMiddleware, EmotionDiaryController.getStats);
router.get('/diary/calendar', authMiddleware, EmotionDiaryController.getCalendar);
router.delete('/diary/:id', authMiddleware, EmotionDiaryController.deleteEntry);

module.exports = router;