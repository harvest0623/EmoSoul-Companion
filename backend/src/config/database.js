const mysql = require('mysql2/promise');

const missingEnv = (name) =>
    new Error(`缺少环境变量 ${name}，请在 backend/.env 中配置（可参考 .env.example）`);

const buildDbConfig = () => {
    const user = process.env.DB_USER;
    if (user === undefined || user === '') {
        throw missingEnv('DB_USER');
    }
    if (process.env.DB_PASSWORD === undefined) {
        throw missingEnv('DB_PASSWORD');
    }
    const port = parseInt(process.env.DB_PORT, 10);
    return {
        host: process.env.DB_HOST || 'localhost',
        port: Number.isFinite(port) && port > 0 ? port : 3306,
        user,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'yu_ni_xiang_ban',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };
};

// 创建连接池
let pool = null;

const getPool = () => {
    if (!pool) {
        pool = mysql.createPool(buildDbConfig());
    }
    return pool;
};

// 执行 SQL - 使用 query 而不是 execute
const query = async (sql, params = []) => {
    const pool = getPool();

    // 确保所有参数都是有效值
    const safeParams = params.map(p => {
        if (p === undefined || p === null) return null;
        if (typeof p === 'number' && isNaN(p)) return 0;
        return p;
    });

    // 使用 query 而不是 execute，避免 prepared statement 问题
    const [results] = await pool.query(sql, safeParams);
    return results;
};

// 执行事务
const transaction = async (callback) => {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// 初始化数据库表
const initDatabase = async () => {
    try {
        if (process.env.NODE_ENV === 'development') {
            const h = process.env.DB_HOST || 'localhost';
            const p = process.env.DB_PORT || '3306';
            const u = process.env.DB_USER || '(未设置)';
            const d = process.env.DB_NAME || 'yu_ni_xiang_ban';
            console.log(`[DB] 当前连接配置: ${h}:${p} / ${d}（用户: ${u}）`);
        }
        // 测试连接（getPool 内会校验 DB_USER / DB_PASSWORD）
        const pool = getPool();
        await pool.query('SELECT 1');
        console.log('✅ MySQL 数据库连接成功');

        // 创建用户表
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                account VARCHAR(255) UNIQUE NOT NULL COMMENT '账号（手机号/邮箱）',
                password VARCHAR(255) NOT NULL COMMENT '加密密码',
                nickname VARCHAR(16) NOT NULL COMMENT '昵称',
                avatar TEXT COMMENT '头像URL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_account (account)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
        `);

        // 为 users 表添加个性化字段
        const columnsToAdd = [
            { name: 'companion_name', definition: "VARCHAR(32) DEFAULT '小伴'" },
            { name: 'companion_personality', definition: "VARCHAR(20) DEFAULT 'warm'" },
            { name: 'chat_style', definition: "VARCHAR(20) DEFAULT 'friendly'" }
        ];

        for (const col of columnsToAdd) {
            const [rows] = await getPool().execute(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
                [process.env.DB_NAME || 'yu_ni_xiang_ban', col.name]
            );
            if (rows.length === 0) {
                await query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.definition}`);
                console.log(`Added column ${col.name} to users table`);
            }
        }

        // 创建登录失败记录表
        await query(`
        CREATE TABLE IF NOT EXISTS login_attempts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          account VARCHAR(255) NOT NULL COMMENT '账号',
          attempts INT DEFAULT 0 COMMENT '失败次数',
          last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后尝试时间',
          locked_until TIMESTAMP NULL COMMENT '锁定截止时间',
          INDEX idx_account (account),
          INDEX idx_locked (locked_until)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录失败记录表'
      `);

        // 创建对话记录表
        await query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          message TEXT NOT NULL COMMENT '用户消息',
          response TEXT COMMENT 'AI回复',
          emotion VARCHAR(20) DEFAULT 'gentle' COMMENT '情绪标签',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话记录表'
      `);

        // 创建Token黑名单表
        await query(`
        CREATE TABLE IF NOT EXISTS token_blacklist (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token TEXT NOT NULL COMMENT 'Token',
          expired_at TIMESTAMP NOT NULL COMMENT '过期时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_expired (expired_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单表'
      `);

        // 创建情绪日记表
        await query(`
        CREATE TABLE IF NOT EXISTS emotion_diary (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          date DATE NOT NULL,
          emotion VARCHAR(20) NOT NULL DEFAULT 'calm',
          intensity INT DEFAULT 3 COMMENT '情绪强度 1-5',
          note TEXT COMMENT '备注',
          source VARCHAR(10) DEFAULT 'auto' COMMENT 'auto=对话自动记录, manual=手动记录',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, date),
          INDEX idx_emotion (emotion),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='情绪日记表'
      `);

        // 为 conversations 表添加 source 字段
        const [sourceCol] = await getPool().execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversations' AND COLUMN_NAME = 'source'`,
          [process.env.DB_NAME || 'yu_ni_xiang_ban']
        );
        if (sourceCol.length === 0) {
          await query("ALTER TABLE conversations ADD COLUMN source VARCHAR(10) DEFAULT 'user'");
          console.log('Added column source to conversations table');
        }

        console.log('✅ 数据库表初始化完成');
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        throw error;
    }
};

module.exports = {
    getPool,
    query,
    transaction,
    initDatabase
};