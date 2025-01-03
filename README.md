# 卡皮巴拉奖励系统设计文档

## 1. 系统概述

这是一个基于积分奖励的任务管理系统，使用卡皮巴拉作为积分单位，分为四个等级：青铜、白银、黄金和钻石。用户可以通过完成任务获得积分，并使用积分兑换奖励。

## 2. 核心功能

### 2.1 任务管理
- 创建任务，包含标题、描述、日期、重复类型和奖励
- 支持单次、每日和每周三种重复类型
- 按奖励类型分组显示任务
- 支持任务折叠/展开
- 支持删除任务（包括系列任务的批量删除）

### 2.2 积分系统
- 四种卡皮巴拉积分：青铜、白银、黄金、钻石
- 完成任务获得对应积分
- 实时显示各类积分数量
- 支持积分增减操作

### 2.3 奖励商店
- 创建、编辑和删除奖励项目
- 按积分类型分组显示奖励
- 支持使用积分兑换奖励
- 显示兑换历史记录

## 3. 数据结构

### 3.1 任务(Task)
```

### 3.2 奖励(Reward)
```typescript
interface Reward {
  id: number;
  title: string;
  description?: string;
  cost: {
    type: 'bronze' | 'silver' | 'gold' | 'diamond';
    amount: number;
  }
}
```

### 3.3 积分(Capybara)
```typescript
interface Capybaras {
  bronze: number;
  silver: number;
  gold: number;
  diamond: number;
}
```

## 4. API 接口

### 4.1 任务相关
```
GET    /api/tasks           获取任务列表
POST   /api/tasks           创建任务
PUT    /api/tasks/:id       更新任务
DELETE /api/tasks/:id       删除任务
```

### 4.2 奖励相关
```
GET    /api/rewards         获取奖励列表
POST   /api/rewards         创建奖励
PUT    /api/rewards/:id     更新奖励
DELETE /api/rewards/:id     删除奖励
POST   /api/rewards/:id/exchange  兑换奖励
```

### 4.3 积分相关
```
GET    /api/capybaras      获取积分余额
PUT    /api/capybaras      更新积分余额
```

## 5. 数据库设计

### 5.1 任务表(tasks)
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  completed INTEGER DEFAULT 0,
  repeat TEXT,
  reward_type TEXT,
  reward_amount INTEGER
)
```

### 5.2 奖励表(rewards)
```sql
CREATE TABLE rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  cost_type TEXT NOT NULL,
  cost_amount INTEGER NOT NULL
)
```

### 5.3 积分表(capybaras)
```sql
CREATE TABLE capybaras (
  user_id TEXT NOT NULL,
  bronze INTEGER DEFAULT 0,
  silver INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  diamond INTEGER DEFAULT 0,
  PRIMARY KEY (user_id)
)
```

## 6. UI 组件结构

### 6.1 主界面布局
- 顶部标题栏
- 侧边导航栏
- 主内容区域

### 6.2 任务编辑器
- 任务表单（标题、描述、日期、重复类型、奖励类型和数量）
- 分组显示的任务列表
- 每组可折叠/展开
- 任务项包含完成状态、删除按钮

### 6.3 奖励商店
- 奖励表单（标题、描述、所需积分类型和数量）
- 分组显示的奖励列表
- 兑换按钮
- 兑换历史记录

### 6.4 积分展示
- 四种积分类型的网格布局
- 每种积分显示图标、名称和数量
- 积分数量的增减控制

## 7. 交互设计

### 7.1 任务操作
- 创建任务时自动展开对应类型分组
- 删除任务时提供确认机制
- 系列任务整体删除
- 任务完成时实时更新积分

### 7.2 奖励操作
- 兑换奖励时检查积分余额
- 兑换成功后自动更新积分和历史记录
- 编辑奖励时提供取消选项

### 7.3 视觉反馈
- 操作成功/失败的消息提示
- 积分不足时禁用兑换按钮
- 任务完成时的视觉标记
- 动画过渡效果

## 8. 安全考虑
- 简单的API KEY认证机制
- 错误处理和日志记录
- 后端服务和前端用同一个端口，靠URL区分