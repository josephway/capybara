import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const API_KEY = 'test123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保使用绝对路径
const dbPath = path.join(__dirname, '../database.sqlite');
console.log('Database path:', dbPath); // 添加日志

// 初始化数据库连接
const dbPromise = open({
    filename: dbPath,
    driver: sqlite3.Database
}).then(db => {
    // 启用外键约束
    return db.exec('PRAGMA foreign_keys = ON').then(() => db);
}).catch(err => {
    console.error('Failed to open database:', err);
    process.exit(1);
});

// 初始化数据库
async function initDb() {
    const db = await dbPromise;

    // 创建任务表
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT,
            completed INTEGER DEFAULT 0,
            repeat TEXT,
            reward_type TEXT,
            reward_amount INTEGER
        )
    `);

    // 创建卡皮巴拉表
    await db.exec(`
        CREATE TABLE IF NOT EXISTS capybaras (
            user_id TEXT NOT NULL,
            bronze INTEGER DEFAULT 0,
            silver INTEGER DEFAULT 0,
            gold INTEGER DEFAULT 0,
            diamond INTEGER DEFAULT 0,
            PRIMARY KEY (user_id)
        )
    `);

    // 为现有用户创建初始记录
    await db.run(`
        INSERT INTO capybaras (user_id, bronze, silver, gold, diamond)
        VALUES ('default', 0, 0, 0, 0)
    `);

    // 创建奖励表
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            cost_type TEXT NOT NULL,
            cost_amount INTEGER NOT NULL
        )
    `);

    // 添加一些默认奖励
    const defaultRewards = [
        {
            title: '休息一小时',
            description: '可以休息一小时，做任何想做的事',
            cost: { type: 'bronze', amount: 5 }
        },
        {
            title: '看一集剧',
            description: '可以观看一集喜欢的电视剧',
            cost: { type: 'bronze', amount: 10 }
        },
        {
            title: '玩游戏半天',
            description: '可以玩半天游戏',
            cost: { type: 'silver', amount: 3 }
        },
        {
            title: '购物奖励',
            description: '可以买一件想买的东西',
            cost: { type: 'gold', amount: 2 }
        },
        {
            title: '休假一天',
            description: '可以休假一整天',
            cost: { type: 'diamond', amount: 1 }
        }
    ];

    // 插入默认奖励
    for (const reward of defaultRewards) {
        await db.run(
            'INSERT OR IGNORE INTO rewards (title, description, cost_type, cost_amount) VALUES (?, ?, ?, ?)',
            [reward.title, reward.description, reward.cost.type, reward.cost.amount]
        );
    }

    console.log('Database initialized successfully');
}

// 启用 JSON 解析
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
    console.log('\n=== New Request ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    console.log('===================\n');
    next();
});

// CORS 中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS request');
        return res.sendStatus(200);
    }
    next();
});

// 认证中间件
function authMiddleware(req, res, next) {
    console.log('\n=== Auth Check ===');
    console.log('Authorization header:', req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Auth failed: Missing or invalid auth header');
        return res.status(401).json({
            error: '未授权访问',
            detail: 'Missing or invalid Authorization header'
        });
    }

    const token = authHeader.split(' ')[1];
    console.log('Received token:', token);
    console.log('Expected token:', API_KEY);
    console.log('Token match:', token === API_KEY);

    if (token !== API_KEY) {
        console.log('Auth failed: Invalid token');
        return res.status(401).json({
            error: '无效的 API Key',
            detail: 'Token does not match'
        });
    }

    console.log('Auth successful');
    next();
}

// 测试端点
app.get('/api/test', authMiddleware, (req, res) => {
    console.log('\n=== Test Endpoint ===');
    console.log('Sending success response');
    res.json({
        message: 'API Key 验证成功',
        timestamp: new Date().toISOString()
    });
});

// 获取卡皮巴拉数量
app.get('/api/capybaras', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const userId = 'default'; // 暂时使用默认用户

        let capybaras = await db.get(
            'SELECT bronze, silver, gold, diamond FROM capybaras WHERE user_id = ?',
            [userId]
        );

        if (!capybaras) {
            // 如果没有记录，创建一个新记录
            await db.run(
                'INSERT INTO capybaras (user_id, bronze, silver, gold, diamond) VALUES (?, 0, 0, 0, 0)',
                [userId]
            );
            capybaras = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
        }

        res.json(capybaras);
    } catch (error) {
        console.error('Failed to get capybaras:', error);
        res.status(500).json({ error: '获取卡皮巴拉数量失败' });
    }
});

// 更新卡皮巴拉数量
app.put('/api/capybaras', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const userId = 'default'; // 暂时使用默认用户
        const { bronze, silver, gold, diamond } = req.body;

        await db.run(
            `UPDATE capybaras 
             SET bronze = ?, silver = ?, gold = ?, diamond = ?
             WHERE user_id = ?`,
            [bronze, silver, gold, diamond, userId]
        );

        res.json({ bronze, silver, gold, diamond });
    } catch (error) {
        console.error('Failed to update capybaras:', error);
        res.status(500).json({ error: '更新卡皮巴拉数量失败' });
    }
});

// 兑换奖励
app.post('/api/rewards/:id/exchange', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;
        const userId = 'default';

        // 获取奖励信息
        const reward = await db.get('SELECT * FROM rewards WHERE id = ?', [id]);
        if (!reward) {
            return res.status(404).json({ error: '奖励不存在' });
        }

        // 获取用户的卡皮巴拉数量
        const capybaras = await db.get('SELECT * FROM capybaras WHERE user_id = ?', [userId]);
        if (!capybaras || capybaras[reward.cost_type] < reward.cost_amount) {
            return res.status(400).json({ error: '卡皮巴拉数量不足' });
        }

        // 扣除卡皮巴拉
        await db.run(
            `UPDATE capybaras SET ${reward.cost_type} = ${reward.cost_type} - ? WHERE user_id = ?`,
            [reward.cost_amount, userId]
        );

        // 添加兑换记录
        await db.run(`
            INSERT INTO exchanged_rewards (
                user_id, 
                reward_id, 
                reward_title, 
                reward_cost_type, 
                reward_cost_amount
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            userId,
            reward.id,
            reward.title,
            reward.cost_type,
            reward.cost_amount
        ]);

        res.json({ message: '兑换成功' });
    } catch (error) {
        console.error('Exchange error:', error);
        res.status(500).json({ error: '兑换失败' });
    }
});

// 获取奖励列表
app.get('/api/rewards', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const rewards = await db.all('SELECT * FROM rewards');

        // 格式化响应
        const formattedRewards = rewards.map(reward => ({
            id: reward.id,
            title: reward.title,
            description: reward.description,
            cost: {
                type: reward.cost_type,
                amount: reward.cost_amount
            }
        }));

        res.json(formattedRewards);
    } catch (error) {
        console.error('Error getting rewards:', error);
        res.status(500).json({ error: '获取奖励失败' });
    }
});

// 创建奖励
app.post('/api/rewards', authMiddleware, async (req, res) => {
    try {
        const { title, description, cost } = req.body;

        if (!title || !cost || !cost.type || !cost.amount) {
            return res.status(400).json({ error: '缺少必要字段' });
        }

        const db = await dbPromise;
        const result = await db.run(
            'INSERT INTO rewards (title, description, cost_type, cost_amount) VALUES (?, ?, ?, ?)',
            [title, description || '', cost.type, cost.amount]
        );

        if (result.lastID) {
            const newReward = await db.get(
                'SELECT id, title, description, cost_type, cost_amount FROM rewards WHERE id = ?',
                [result.lastID]
            );

            const formattedReward = {
                id: newReward.id,
                title: newReward.title,
                description: newReward.description,
                cost: {
                    type: newReward.cost_type,
                    amount: newReward.cost_amount
                }
            };

            res.json(formattedReward);
        } else {
            throw new Error('Failed to insert reward');
        }
    } catch (error) {
        res.status(500).json({ error: '添加奖励失败' });
    }
});

// 更新奖励
app.put('/api/rewards/:id', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;
        const { title, description, cost } = req.body;

        await db.run(
            `UPDATE rewards 
             SET title = ?, description = ?, cost_type = ?, cost_amount = ?
             WHERE id = ?`,
            [title, description, cost.type, cost.amount, id]
        );

        res.json({
            id: parseInt(id),
            title,
            description,
            cost
        });
    } catch (error) {
        console.error('Failed to update reward:', error);
        res.status(500).json({ error: '更新奖励失败' });
    }
});

// 删除奖励
app.delete('/api/rewards/:id', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        await db.run('DELETE FROM rewards WHERE id = ?', [id]);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('Failed to delete reward:', error);
        res.status(500).json({ error: '删除奖励失败' });
    }
});

// 任务相关的路由
// 获取任务列表
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        console.log('Getting tasks from database...');
        const db = await dbPromise;

        // 检查表是否存在
        const tableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
        );

        if (!tableExists) {
            console.log('Tasks table does not exist, creating...');
            await initDb();
        }

        console.log('Querying tasks...');
        const tasks = await db.all('SELECT * FROM tasks');
        console.log('Found tasks:', tasks);

        const formattedTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            date: task.date,
            completed: Boolean(task.completed),
            repeat: task.repeat,
            reward: {
                type: task.reward_type,
                amount: task.reward_amount
            }
        }));

        console.log('Sending formatted tasks:', formattedTasks);
        res.json(formattedTasks);
    } catch (error) {
        console.error('Error in /api/tasks:', error);
        res.status(500).json({
            error: '获取任务失败',
            detail: error.message,
            stack: error.stack
        });
    }
});

// 创建任务
app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const { title, description, date, repeat, reward } = req.body;

        const result = await db.run(
            `INSERT INTO tasks (title, description, date, repeat, reward_type, reward_amount)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, date, repeat, reward.type, reward.amount]
        );

        res.json({
            id: result.lastID,
            title,
            description,
            date,
            completed: false,
            repeat,
            reward
        });
    } catch (error) {
        console.error('Failed to create task:', error);
        res.status(500).json({ error: '创建任务失败' });
    }
});

// 更新任务
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        // 检查任务是否存在
        const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);

        if (!existingTask) {
            return res.status(404).json({ error: '任务不存在' });
        }

        // 准备更新数据
        const updates = {
            title: req.body.title || existingTask.title,
            description: req.body.description || existingTask.description,
            date: req.body.date || existingTask.date,
            completed: req.body.completed !== undefined ? req.body.completed : existingTask.completed,
            repeat: req.body.repeat || existingTask.repeat,
            reward_type: req.body.reward_type || existingTask.reward_type,
            reward_amount: req.body.reward_amount || existingTask.reward_amount
        };

        // 如果任务完成状态发生变化，先检查卡皮巴拉数量
        if (updates.completed !== existingTask.completed && !updates.completed) {
            const capybaras = await db.get(
                'SELECT * FROM capybaras WHERE user_id = ?',
                ['default']
            );

            if (!capybaras || capybaras[updates.reward_type] < updates.reward_amount) {
                return res.status(400).json({
                    error: '卡皮巴拉数量不足，无法取消完成状态'
                });
            }
        }

        // 更新任务
        await db.run(`
            UPDATE tasks 
            SET title = ?, 
                description = ?, 
                date = ?, 
                completed = ?, 
                repeat = ?,
                reward_type = ?,
                reward_amount = ?
            WHERE id = ?
        `, [
            updates.title,
            updates.description,
            updates.date,
            updates.completed ? 1 : 0,
            updates.repeat,
            updates.reward_type,
            updates.reward_amount,
            id
        ]);

        // 如果任务完成状态发生变化，更新卡皮巴拉数量
        if (updates.completed !== existingTask.completed) {
            const change = updates.completed ? updates.reward_amount : -updates.reward_amount;

            // 确保用户有卡皮巴拉记录
            await db.run(`
                INSERT OR IGNORE INTO capybaras (user_id, bronze, silver, gold, diamond)
                VALUES ('default', 0, 0, 0, 0)
            `);

            // 更新卡皮巴拉数量，使用 MAX 函数确保不会出现负数
            await db.run(`
                UPDATE capybaras 
                SET ${updates.reward_type} = MAX(0, ${updates.reward_type} + ?)
                WHERE user_id = ?
            `, [change, 'default']);
        }

        // 获取更新后的任务和卡皮巴拉数量
        const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
        const updatedCapybaras = await db.get('SELECT * FROM capybaras WHERE user_id = ?', ['default']);

        res.json({
            task: updatedTask,
            capybaras: updatedCapybaras
        });
    } catch (error) {
        res.status(500).json({ error: '更新任务失败' });
    }
});

// 删除任务
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;

        await db.run('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('Failed to delete task:', error);
        res.status(500).json({ error: '删除任务失败' });
    }
});

// 添加一个测试路由来检查数据库表结构（暂时不需要认证）
app.get('/api/debug/tables', async (req, res) => {
    try {
        const db = await dbPromise;

        // 获取所有表
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        const schema = {};

        // 获取每个表的结构
        for (const table of tables) {
            const columns = await db.all(`PRAGMA table_info('${table.name}')`);
            schema[table.name] = columns;

            // 同时获取表中的数据条数
            const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            schema[table.name].count = count.count;
        }

        res.json(schema);
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: 'Debug failed', detail: error.message });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('\n=== Error ===');
    console.error(err);
    res.status(500).json({
        error: '服务器内部错误',
        detail: err.message
    });
});

// 在服务器启动时检查数据库
async function checkDatabase() {
    try {
        const db = await dbPromise;

        console.log('=== Database Check ===');

        // 获取所有表
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('\nTables found:', tables.map(t => t.name));

        // 检查每个表的结构
        for (const table of tables) {
            console.log(`\nSchema for ${table.name}:`);
            const columns = await db.all(`PRAGMA table_info('${table.name}')`);
            console.log(columns);

            // 获取表中的数据条数
            const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`Records in ${table.name}: ${count.count}`);

            // 如果是rewards表，显示一些示例数据
            if (table.name === 'rewards') {
                const samples = await db.all(`SELECT * FROM rewards LIMIT 3`);
                console.log('Sample rewards:', samples);
            }
        }

        console.log('\n=== Database Check Complete ===\n');
    } catch (error) {
        console.error('Database check failed:', error);
    }
}

// 数据库初始化
async function initDatabase() {
    try {
        const db = await dbPromise;

        console.log('Initializing database...');

        // 备份现有数据
        const oldData = await db.get(`
            SELECT * FROM capybaras
        `).catch(() => ({}));

        console.log('Current data:', oldData);

        // 删除旧表
        await db.run(`DROP TABLE IF EXISTS capybaras`);
        console.log('Old table dropped');

        // 创建新表
        await db.run(`
            CREATE TABLE IF NOT EXISTS capybaras (
                user_id TEXT NOT NULL,
                bronze INTEGER DEFAULT 0,
                silver INTEGER DEFAULT 0,
                gold INTEGER DEFAULT 0,
                diamond INTEGER DEFAULT 0,
                PRIMARY KEY (user_id)
            )
        `);

        // 创建奖励表（如果不存在）
        await db.run(`
            CREATE TABLE IF NOT EXISTS rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                cost_type TEXT NOT NULL,
                cost_amount INTEGER NOT NULL
            )
        `);

        // 创建任务表（如果不存在）
        await db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                date TEXT,
                completed INTEGER DEFAULT 0,
                repeat TEXT,
                reward_type TEXT,
                reward_amount INTEGER
            )
        `);

        // 恢复卡皮巴拉数据
        await db.run(`
            INSERT INTO capybaras (user_id, bronze, silver, gold, diamond)
            VALUES (?, ?, ?, ?, ?)
        `, [
            'default',
            oldData.bronze || 0,
            oldData.silver || 0,
            oldData.gold || 0,
            oldData.diamond || 0
        ]);

        // 创建兑换记录表
        await db.run(`
            CREATE TABLE IF NOT EXISTS exchanged_rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                reward_id INTEGER NOT NULL,
                reward_title TEXT NOT NULL,
                reward_cost_type TEXT NOT NULL,
                reward_cost_amount INTEGER NOT NULL,
                exchange_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

// 获取兑换记录的路由
app.get('/api/exchanged-rewards', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching exchanged rewards...');  // 添加调试日志
        const db = await dbPromise;
        const records = await db.all(`
            SELECT 
                id,
                reward_id,
                reward_title as title,
                reward_cost_type as "cost.type",
                reward_cost_amount as "cost.amount",
                exchange_date as exchangeDate
            FROM exchanged_rewards 
            WHERE user_id = ? 
            ORDER BY exchange_date DESC
        `, ['default']);

        console.log('Found records:', records);  // 添加调试日志

        const formattedRecords = records.map(record => ({
            id: record.id,
            reward: {
                id: record.reward_id,
                title: record.title,
                cost: {
                    type: record['cost.type'],
                    amount: record['cost.amount']
                }
            },
            exchangeDate: record.exchangeDate
        }));

        res.json(formattedRecords);
    } catch (error) {
        console.error('Failed to get exchanged rewards:', error);
        res.status(500).json({ error: '获取兑换记录失败' });
    }
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, async () => {
    console.log('\n=== Server Started ===');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API Key for testing:', API_KEY);

    try {
        console.log('Initializing database...');
        await initDatabase();
        await checkDatabase();
    } catch (error) {
        console.error('Failed to start server properly:', error);
    }
}); 