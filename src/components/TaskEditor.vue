<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../db';

// 从数据库加载任务
const tasks = ref([]);

// 加载任务数据
async function loadTasks() {
  try {
    const savedTasks = await db.tasks.toArray();
    tasks.value = savedTasks;
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasks.value = [];
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTasks();
});

// 新任务表单
const newTask = ref({
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  reward: {
    type: 'bronze',
    amount: 1
  },
  repeat: 'none',
  completed: false
});

// 添加任务
async function addTask() {
  if (!newTask.value.title) {
    showMessage('请输入任务标题');
    return;
  }
  
  const baseTask = {
    title: newTask.value.title,
    reward: { ...newTask.value.reward },
    completed: false,
    repeat: newTask.value.repeat
  };

  try {
    // 检查任务数量
    const taskCount = await db.tasks.count();
    if (taskCount >= 5000) {
      const oldTasks = await db.tasks
        .orderBy('date')
        .limit(taskCount - 4999)
        .toArray();
      
      await db.tasks.bulkDelete(oldTasks.map(t => t.id));
      showMessage(`已自动清理 ${oldTasks.length} 条最早的任务记录`);
    }

    let newTasks = [];
    if (newTask.value.repeat === 'daily') {
      // 添加未来30天的每日任务
      for (let i = 0; i < 30; i++) {
        const date = new Date(newTask.value.date);
        date.setDate(date.getDate() + i);
        newTasks.push({
          ...baseTask,
          date: date.toISOString().split('T')[0]
        });
      }
    } else if (newTask.value.repeat === 'weekly') {
      // 添加未来4周的每周任务
      for (let i = 0; i < 4; i++) {
        const date = new Date(newTask.value.date);
        date.setDate(date.getDate() + i * 7);
        newTasks.push({
          ...baseTask,
          date: date.toISOString().split('T')[0]
        });
      }
    } else {
      // 单次任务
      newTasks.push({
        ...baseTask,
        date: newTask.value.date
      });
    }

    // 批量添加到数据库，让数据库自动生成ID
    const ids = await db.tasks.bulkAdd(newTasks, { allKeys: true });
    newTasks = newTasks.map((task, index) => ({
      ...task,
      id: ids[index]
    }));
    
    tasks.value = [...tasks.value, ...newTasks];
    newTask.value.title = '';
    showMessage('任务添加成功');
  } catch (error) {
    console.error('Failed to add tasks:', error);
    showMessage('添加任务失败，请重试');
  }
}

// 删除任务
async function deleteTask(taskId) {
  try {
    await db.tasks.delete(taskId);
    const index = tasks.value.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks.value.splice(index, 1);
      showMessage('任务删除成功');
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
    showMessage('删除任务失败，请重试');
  }
}

// 清理旧任务
async function cleanupOldTasks() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // 获取所有任务，然后在内存中过滤
    const allTasks = await db.tasks.toArray();
    const tasksToDelete = allTasks.filter(task => 
      task.completed && task.date < thirtyDaysAgoStr
    );

    if (tasksToDelete.length > 0) {
      // 批量删除过期任务
      await db.tasks.bulkDelete(tasksToDelete.map(t => t.id));
      
      // 更新本地状态
      tasks.value = tasks.value.filter(task => 
        !tasksToDelete.find(t => t.id === task.id)
      );
      
      showMessage(`已自动清理 ${tasksToDelete.length} 条30天前的已完成任务`);
    }
  } catch (error) {
    console.error('Failed to cleanup old tasks:', error);
  }
}

// 消息提示
const message = ref('');
function showMessage(msg) {
  message.value = msg;
  setTimeout(() => {
    message.value = '';
  }, 2000);
}

// 设置定时器
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(cleanupOldTasks, CLEANUP_INTERVAL);

// 组件挂载时执行清理
onMounted(() => {
  cleanupOldTasks();
});

// 检查并添加重复任务
async function checkAndAddRecurringTasks() {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // 获取所有任务，然后在内存中过滤
    const allTasks = await db.tasks.toArray();
    const recurringTasks = allTasks.filter(task => 
      task.repeat && ['daily', 'weekly'].includes(task.repeat)
    );
    
    for (const template of recurringTasks) {
      // 找到该模板的最后一个任务日期
      const templateTasks = allTasks.filter(task => 
        task.title === template.title && 
        task.repeat === template.repeat
      );
      
      if (templateTasks.length === 0) continue;

      const lastTaskDate = new Date(Math.max(
        ...templateTasks.map(t => new Date(t.date))
      ));
      
      // 如果最后一个任务日期距今不到15天，就添加新任务
      if ((thirtyDaysFromNow - lastTaskDate) > 15 * 24 * 60 * 60 * 1000) {
        const startDate = new Date(lastTaskDate);
        startDate.setDate(lastTaskDate.getDate() + 1);
        
        let newTasks = [];
        
        if (template.repeat === 'daily') {
          // 添加未来30天的每日任务
          for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // 检查该日期是否已存在相同任务
            const existingTask = templateTasks.find(t => 
              t.date === dateStr && t.title === template.title
            );
            
            if (!existingTask) {
              newTasks.push({
                title: template.title,
                date: dateStr,
                reward: { ...template.reward },
                completed: false,
                repeat: template.repeat
              });
            }
          }
        } else if (template.repeat === 'weekly') {
          // 添加未来4周的每周任务
          for (let i = 0; i < 4; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i * 7);
            const dateStr = date.toISOString().split('T')[0];
            
            // 检查该日期是否已存在相同任务
            const existingTask = templateTasks.find(t => 
              t.date === dateStr && t.title === template.title
            );
            
            if (!existingTask) {
              newTasks.push({
                title: template.title,
                date: dateStr,
                reward: { ...template.reward },
                completed: false,
                repeat: template.repeat
              });
            }
          }
        }

        if (newTasks.length > 0) {
          // 批量添加到数据库
          const ids = await db.tasks.bulkAdd(newTasks, { allKeys: true });
          newTasks = newTasks.map((task, index) => ({
            ...task,
            id: ids[index]
          }));
          tasks.value = [...tasks.value, ...newTasks];
        }
      }
    }
  } catch (error) {
    console.error('Failed to check and add recurring tasks:', error);
  }
}

// 设置定时器，每天检查一次
const DAILY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
setInterval(checkAndAddRecurringTasks, DAILY_CHECK_INTERVAL);

// 在组件挂载时也执行一次检查
onMounted(() => {
  loadTasks();
  cleanupOldTasks();
  checkAndAddRecurringTasks();
});

// 获取奖励类型名称
function getRewardTypeName(type) {
  const names = {
    diamond: '钻石',
    gold: '黄金',
    silver: '白银',
    bronze: '青铜'
  };
  return names[type] || type;
}

// 对任务进行分组的计算属性
const uniqueTasks = computed(() => {
  const taskGroups = {};
  
  tasks.value.forEach(task => {
    const key = task.repeat !== 'none' 
      ? `${task.title}-${task.repeat}-${task.reward.type}-${task.reward.amount}`
      : task.id.toString();
      
    if (!taskGroups[key] || new Date(task.date) < new Date(taskGroups[key].date)) {
      taskGroups[key] = {
        ...task,
        nextDate: task.repeat !== 'none' 
          ? tasks.value
              .filter(t => 
                t.title === task.title && 
                t.repeat === task.repeat &&
                new Date(t.date) > new Date()
              )
              .sort((a, b) => new Date(a.date) - new Date(b.date))[0]?.date
          : task.date
      };
    }
  });
  
  return Object.values(taskGroups)
    .sort((a, b) => {
      if (a.repeat !== 'none' && b.repeat === 'none') return -1;
      if (a.repeat === 'none' && b.repeat !== 'none') return 1;
      return new Date(a.nextDate) - new Date(b.nextDate);
    });
});

// 删除任务或任务系列
async function deleteTaskGroup(task) {
  try {
    if (task.repeat !== 'none') {
      // 删除所有相同标题和重复类型的任务
      const tasksToDelete = tasks.value.filter(t => 
        t.title === task.title && t.repeat === task.repeat
      );
      await db.tasks.bulkDelete(tasksToDelete.map(t => t.id));
      tasks.value = tasks.value.filter(t => 
        !(t.title === task.title && t.repeat === task.repeat)
      );
    } else {
      // 删除单个任务
      await db.tasks.delete(task.id);
      tasks.value = tasks.value.filter(t => t.id !== task.id);
    }
    showMessage(`成功删除${task.repeat !== 'none' ? '系列' : ''}任务`);
  } catch (error) {
    console.error('Failed to delete task(s):', error);
    showMessage('删除失败，请重试');
  }
}
</script>

<template>
  <div class="task-editor">
    <div class="add-task-form">
      <h2>添加新任务</h2>
      <div class="form-group">
        <input 
          type="text" 
          v-model="newTask.title" 
          placeholder="任务标题"
          class="input-field"
        >
        <div class="date-repeat-group">
          <input 
            type="date" 
            v-model="newTask.date"
            class="input-field"
          >
          <select v-model="newTask.repeat" class="input-field">
            <option value="none">不重复</option>
            <option value="daily">每日重复</option>
            <option value="weekly">每周重复</option>
          </select>
        </div>
        <div class="reward-group">
          <select v-model="newTask.reward.type" class="input-field">
            <option value="bronze">青铜卡皮巴拉</option>
            <option value="silver">白银卡皮巴拉</option>
            <option value="gold">黄金卡皮巴拉</option>
            <option value="diamond">钻石卡皮巴拉</option>
          </select>
          <input 
            type="number" 
            v-model.number="newTask.reward.amount"
            min="1"
            class="input-field reward-amount"
          >
        </div>
        <button @click="addTask" class="add-btn">添加任务</button>
      </div>
    </div>

    <div class="tasks-list">
      <h2>任务列表</h2>
      
      <!-- 使用计算属性对任务进行分组显示 -->
      <div v-for="task in uniqueTasks" 
           :key="task.id" 
           class="task-item"
           :class="{ 'recurring-task': task.repeat !== 'none' }">
        <div class="task-info">
          <span class="task-title">{{ task.title }}</span>
          <div class="task-description" v-if="task.description">
            {{ task.description }}
          </div>
          <div class="task-details">
            <span class="task-date" v-if="task.repeat === 'none'">
              {{ task.date }}
            </span>
            <span class="task-repeat" v-else>
              {{ task.repeat === 'daily' ? '每日任务' : '每周任务' }}
              (下次: {{ task.nextDate }})
            </span>
            <span :class="['task-reward', task.reward.type]">
              {{ task.reward.amount }} {{ getRewardTypeName(task.reward.type) }}
            </span>
          </div>
        </div>
        <button @click="deleteTaskGroup(task)" class="delete-btn">
          删除{{ task.repeat !== 'none' ? '系列' : '' }}
        </button>
      </div>
    </div>

    <div class="message" v-if="message">{{ message }}</div>
  </div>
</template>

<style scoped>
.task-editor {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.add-task-form {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.date-repeat-group, .reward-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-field {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.reward-amount {
  width: 100px;
}

.add-btn {
  background: #4CAF50;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.tasks-list {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: #f8f9fa;
}

.recurring-task {
  background-color: #f8f9fa;
  border-left: 4px solid #2196f3;
}

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-title {
  font-size: 1.1em;
  font-weight: 500;
}

.task-details {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 0.9em;
}

.task-date, .task-repeat {
  color: #666;
}

.task-repeat {
  color: #2196f3;
  font-weight: 500;
}

.task-reward {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.task-reward.bronze { background: #fff3e0; color: #ef6c00; }
.task-reward.silver { background: #f5f5f5; color: #757575; }
.task-reward.gold { background: #fff8e1; color: #ffa000; }
.task-reward.diamond { background: #e3f2fd; color: #00bcd4; }

.delete-btn {
  background: #f44336;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.task-description {
  color: #666;
  font-size: 0.9em;
  margin-top: 4px;
  margin-bottom: 8px;
}

/* 添加响应式样式 */
@media (max-width: 768px) {
  .task-form {
    padding: 15px;
  }

  .form-group {
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 5px;
  }

  .task-item {
    padding: 15px;
    flex-direction: column;
    gap: 10px;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 