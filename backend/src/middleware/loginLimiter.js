const { query } = require('../config/database');
const ResponseUtil = require('../utils/response');

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_TIME_MINUTES = parseInt(process.env.LOCK_TIME_MINUTES) || 15;

/**
 * 登录限制中间件
 * 防止暴力破解密码
 */
const loginLimiter = async (ctx, next) => {
    const { account } = ctx.request.body;

    if (!account) {
        await next();
        return;
    }

    try {
        // 查询登录失败记录
        const results = await query(
            'SELECT * FROM login_attempts WHERE account = ?',
            [account]
        );
        const record = results[0];

        const now = new Date();

        // 检查是否被锁定
        if (record && record.locked_until) {
            const lockedUntil = new Date(record.locked_until);
            if (lockedUntil > now) {
                const minutesLeft = Math.ceil((lockedUntil - now) / (1000 * 60));
                ResponseUtil.error(
                    ctx,
                    `账号已锁定，请${minutesLeft}分钟后重试`,
                    423,
                    200
                );
                return;
            }
        }

        // 将登录尝试信息附加到上下文
        ctx.state.loginAttempt = {
            record,
            account
        };

        await next();

        // 根据响应结果更新登录尝试记录
        const { body } = ctx.response;

        if (body && body.code === 200) {
            // 登录成功，重置失败次数
            await resetAttempts(account);
        } else {
            // 登录失败，增加失败次数
            await incrementAttempts(account);
        }
    } catch (error) {
        console.error('登录限制中间件错误:', error);
        // 错误时不再调用 next，让错误处理中间件处理
        throw error;
    }
};

/**
 * 增加失败次数
 */
async function incrementAttempts(account) {
    const results = await query(
        'SELECT * FROM login_attempts WHERE account = ?',
        [account]
    );
    const record = results[0];

    const now = new Date();

    if (!record) {
        // 创建新记录
        await query(
            'INSERT INTO login_attempts (account, attempts, last_attempt) VALUES (?, 1, NOW())',
            [account]
        );
    } else {
        const newAttempts = record.attempts + 1;

        // 检查是否达到最大失败次数
        if (newAttempts >= MAX_ATTEMPTS) {
            const lockedUntil = new Date(now.getTime() + LOCK_TIME_MINUTES * 60 * 1000);
            await query(
                'UPDATE login_attempts SET attempts = ?, last_attempt = NOW(), locked_until = ? WHERE account = ?',
                [newAttempts, lockedUntil, account]
            );
        } else {
            await query(
                'UPDATE login_attempts SET attempts = ?, last_attempt = NOW() WHERE account = ?',
                [newAttempts, account]
            );
        }
    }
}

/**
 * 重置失败次数
 */
async function resetAttempts(account) {
    await query(
        'DELETE FROM login_attempts WHERE account = ?',
        [account]
    );
}

module.exports = loginLimiter;