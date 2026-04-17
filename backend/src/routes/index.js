const Router = require('koa-router');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const ChatController = require('../controllers/chatController');
const EmotionDiaryController = require('../controllers/emotionDiaryController');
const MomentController = require('../controllers/momentController');
const TodoController = require('../controllers/todoController');
const ShareController = require('../controllers/shareController');
const EmotionAnalysisController = require('../controllers/emotionAnalysisController');
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

/**
 * 成就相关路由
 */
router.get('/achievements', authMiddleware, ShareController.getAchievements);
router.post('/achievements/check', authMiddleware, ShareController.checkAchievements);

/**
 * 待办事项相关路由
 */
router.get('/todos', authMiddleware, TodoController.getTodos);
router.post('/todos', authMiddleware, TodoController.createTodo);
router.put('/todos/:id', authMiddleware, TodoController.updateTodo);
router.delete('/todos/:id', authMiddleware, TodoController.deleteTodo);

/**
 * 心情动态相关路由
 */
router.get('/moments', authMiddleware, MomentController.getMoments);
router.post('/moments', authMiddleware, MomentController.createMoment);
router.delete('/moments/:id', authMiddleware, MomentController.deleteMoment);
router.post('/moments/:id/like', authMiddleware, MomentController.toggleLike);
router.get('/moments/:id/comments', authMiddleware, MomentController.getComments);
router.post('/moments/:id/comments', authMiddleware, MomentController.addComment);

/**
 * 情绪识别分析相关路由
 */
router.get('/emotion-analysis/health', EmotionAnalysisController.checkHealth);
router.post('/emotion-analysis/start-service', authMiddleware, EmotionAnalysisController.startService);
router.post('/emotion-analysis/analyze', authMiddleware, EmotionAnalysisController.analyzeFrame);
router.get('/emotion-analysis/history', authMiddleware, EmotionAnalysisController.getHistory);

module.exports = router;