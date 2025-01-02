import Dexie from 'dexie';

// 创建数据库实例
const db = new Dexie('capybara-app');

// 定义数据库结构
db.version(1).stores({
    capybaras: 'type',
    tasks: '++id, title, description, date, completed, repeat, nextDate',
    rewards: '++id, title, description, cost'
});

// 导出数据库实例
export { db }; 