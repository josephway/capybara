import Dexie from 'dexie';

// 创建数据库实例
const db = new Dexie('capybara-app');

// 定义数据库结构
db.version(1).stores({
    capybaras: 'type',
    tasks: '++id, title, description, date, completed, repeat, nextDate',
    rewards: '++id, title, description, cost'
});

// 初始化默认数据
async function initDefaults() {
    const capybaraCount = await db.capybaras.count();

    if (capybaraCount === 0) {
        // 初始化卡皮巴拉数据
        await db.capybaras.bulkPut([
            { type: 'diamond', amount: 0 },
            { type: 'gold', amount: 0 },
            { type: 'silver', amount: 0 },
            { type: 'bronze', amount: 0 }
        ]);
    }
}

// 初始化数据库
initDefaults().catch(err => {
    console.error('Failed to initialize database:', err);
});

// 导出数据库实例
export { db }; 