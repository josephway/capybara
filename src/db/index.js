import Dexie from 'dexie';

export class CapybaraDB extends Dexie {
    constructor() {
        super('CapybaraDB');

        // 升级到版本2，重新定义数据结构
        this.version(2).stores({
            tasks: '++id, date, title, completed, repeat', // 使用自增ID
            rewards: '++id, title',
            capybaras: 'type'
        });
    }

    // 初始化默认数据
    async initDefaults() {
        const capybaraCount = await this.capybaras.count();

        if (capybaraCount === 0) {
            // 初始化卡皮巴拉数据
            await this.capybaras.bulkPut([
                { type: 'diamond', amount: 0 },
                { type: 'gold', amount: 0 },
                { type: 'silver', amount: 0 },
                { type: 'bronze', amount: 0 }
            ]);
        }
    }
}

export const db = new CapybaraDB();

// 初始化数据库
db.initDefaults().catch(err => {
    console.error('Failed to initialize database:', err);
}); 