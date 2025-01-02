<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api/client';

const tasks = ref([]);
const message = ref('');
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

// 添加折叠状态管理
const expandedTypes = ref({
  bronze: true,
  silver: true,
  gold: true,
  diamond: true
});

// 按类型分组的任务
const tasksByType = computed(() => {
  const groups = {
    diamond: [],
    gold: [],
    silver: [],
    bronze: []
  };
  
  // 先处理系列任务
  const seriesTasks = new Map();
  tasks.value.forEach(task => {
    if (task.repeat !== 'none') {
      const key = `${task.title}-${task.repeat}-${task.reward.type}-${task.reward.amount}`;
      if (!seriesTasks.has(key)) {
        seriesTasks.set(key, { ...task, isSeriesTask: true });
      }
    }
  });

  // 将系列任务添加到对应类型组
  seriesTasks.forEach(task => {
    if (groups[task.reward.type]) {
      groups[task.reward.type].push(task);
    }
  });

  // 添加非重复任务
  tasks.value.forEach(task => {
    if (task.repeat === 'none' && groups[task.reward.type]) {
      groups[task.reward.type].push(task);
    }
  });
  
  return groups;
});

// 切换折叠状态
function toggleExpand(type) {
  expandedTypes.value[type] = !expandedTypes.value[type];
}

// 加载任务
async function loadTasks() {
  try {
    console.log('Loading tasks...');  // 添加日志
    const allTasks = await api.getTasks();
    console.log('Loaded tasks:', allTasks);  // 添加日志
    tasks.value = allTasks;
  } catch (error) {
    console.error('Failed to load tasks:', error);
    showMessage('加载任务失败');
  }
}

// 添加任务
async function addTask() {
  if (!newTask.value.title) {
    showMessage('请填写任务标题');
    return;
  }

  try {
    console.log('Sending task to server:', newTask.value);
    await api.createTask(newTask.value);
    await loadTasks();
    resetForm();
    showMessage('任务添加成功');
  } catch (error) {
    console.error('Failed to add task:', error);
    showMessage('添加任务失败');
  }
}

// 添加重置表单的辅助函数
function resetForm() {
  newTask.value = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reward: {
      type: 'bronze',
      amount: 1
    },
    repeat: 'none',
    completed: false
  };
}

// 删除任务
async function deleteTask(task) {
  try {
    if (task.repeat !== 'none') {
      // 删除系列任务
      const seriesTasks = tasks.value.filter(t => 
        t.title === task.title && 
        t.repeat === task.repeat &&
        t.reward.type === task.reward.type &&
        t.reward.amount === task.reward.amount
      );
      
      // 并行删除所有相关任务
      await Promise.all(seriesTasks.map(t => api.deleteTask(t.id)));
      
      // 从本地状态中移除这些任务
      tasks.value = tasks.value.filter(t => !seriesTasks.includes(t));
      
      showMessage('系列任务删除成功');
    } else {
      // 删除单个任务
      await api.deleteTask(task.id);
      const index = tasks.value.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks.value.splice(index, 1);
      }
      showMessage('任务删除成功');
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
    showMessage('删除任务失败，请重试');
  }
}

function showMessage(text) {
  message.value = text;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

// 生成每日任务
function generateDailyTasks(baseTask) {
  const tasks = [];
  const startDate = new Date(baseTask.date);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    tasks.push({
      ...baseTask,
      date: date.toISOString().split('T')[0]
    });
  }
  return tasks;
}

// 生成每周任务
function generateWeeklyTasks(baseTask) {
  const tasks = [];
  const startDate = new Date(baseTask.date);
  for (let i = 0; i < 4; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 7));
    tasks.push({
      ...baseTask,
      date: date.toISOString().split('T')[0]
    });
  }
  return tasks;
}

// 获取类型名称
function getTypeName(type) {
  const names = {
    diamond: '钻石卡皮巴拉',
    gold: '黄金卡皮巴拉',
    silver: '白银卡皮巴拉',
    bronze: '青铜卡皮巴拉'
  };
  return names[type] || type;
}

// 获取重复类型名称
function getRepeatName(repeat) {
  const types = {
    none: '不重复',
    daily: '每日重复',
    weekly: '每周重复'
  };
  return types[repeat] || repeat;
}

async function toggleTask(task) {
  try {
    const updatedTask = {
      ...task,
      completed: !task.completed
    };

    await api.updateTask(task.id, updatedTask);
    
    // 更新任务状态时同时处理奖励
    if (updatedTask.completed) {
      // 完成任务时增加奖励
      emit('reward-earned', task.reward);
    } else {
      // 取消完成时减少奖励
      emit('reward-earned', {
        type: task.reward.type,
        amount: -task.reward.amount // 使用负数来减少奖励
      });
    }
    
    await loadTasks();
  } catch (error) {
    console.error('Failed to update task:', error);
    showMessage('更新任务状态失败');
  }
}

onMounted(() => {
  loadTasks();
});
</script>

<template>
  <div class="task-editor">
    <div v-if="message" class="message">{{ message }}</div>
    
    <!-- 添加任务表单 -->
    <form @submit.prevent="addTask" class="task-form">
      <div class="add-task-form">
        <h2>添加新任务</h2>
        <div class="form-group">
          <input 
            type="text" 
            v-model="newTask.title" 
            placeholder="任务标题"
            class="input-field"
          >
          <textarea 
            v-model="newTask.description"
            placeholder="任务描述（选填）"
            class="input-field"
            rows="3"
          ></textarea>
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
          <button type="submit" class="add-btn">添加任务</button>
        </div>
      </div>
    </form>

    <!-- 按类型分组的任务列表 -->
    <div class="task-list">
      <div v-for="(tasks, type) in tasksByType" 
           :key="type" 
           class="tasks-section"
           :class="type">
        <div class="type-header" @click="toggleExpand(type)">
          <h2>
            {{ getTypeName(type) }}
            <span class="task-count">({{ tasks.length }})</span>
          </h2>
          <span class="expand-icon">
            {{ expandedTypes[type] ? '▼' : '▶' }}
          </span>
        </div>
        
        <div v-show="expandedTypes[type]" 
             class="tasks-group"
             :class="{ expanded: expandedTypes[type] }">
          <div v-for="task in tasks" 
               :key="task.id || task.title" 
               class="task-item"
               :class="{ 'series-task': task.isSeriesTask }">
            <div class="task-content">
              <div class="task-header">
                <h3>{{ task.title }}</h3>
                <button 
                  @click="deleteTask(task)"
                  class="delete-btn"
                  :class="{ 'series-delete': task.isSeriesTask }"
                >
                  <span class="delete-icon">×</span>
                  <span class="delete-text">
                    {{ task.isSeriesTask ? '删除系列' : '删除' }}
                  </span>
                </button>
              </div>
              <p v-if="task.description" class="task-description">
                {{ task.description }}
              </p>
              <div class="task-info">
                <span class="task-date">日期: {{ task.date }}</span>
                <span v-if="task.isSeriesTask" class="task-repeat">
                  {{ getRepeatName(task.repeat) }}
                </span>
                <span class="task-reward" :class="task.reward.type">
                  奖励: {{ task.reward.amount }} 个
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.series-task {
  border-left: 4px solid #2196F3;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.task-header h3 {
  margin: 0;
  flex: 1;
}

.task-content {
  flex: 1;
}

.task-info {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 0.9em;
  margin-top: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.task-repeat {
  color: #2196F3;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ff5252;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
  opacity: 0.9;
  white-space: nowrap;
}

.delete-btn:hover {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
}

.series-delete {
  background: #f44336;
}

.delete-icon {
  font-size: 1.2em;
  font-weight: bold;
}

.task-description {
  color: #666;
  font-size: 0.9em;
  margin: 8px 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-item {
  animation: fadeIn 0.3s ease-out;
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

textarea.input-field {
  width: 100%;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.has-tooltip {
  position: relative;
}

.has-tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  top: -10px;
  transform: translateY(-100%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  white-space: pre-wrap;
  max-width: 300px;
  z-index: 1000;
  pointer-events: none;
}

.has-tooltip:hover::before {
  content: '';
  position: absolute;
  left: 20px;
  top: -10px;
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
  pointer-events: none;
}

.tasks-section {
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.type-header:hover {
  background-color: #f5f5f5;
}

.type-header h2 {
  margin: 0;
  font-size: 1.2em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-count {
  font-size: 0.8em;
  color: #666;
  font-weight: normal;
}

.expand-icon {
  color: #666;
  transition: transform 0.2s;
}

.tasks-group {
  border-top: 1px solid #eee;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 类型特定的样式 */
.tasks-section.diamond .type-header { border-left: 4px solid #00bcd4; }
.tasks-section.gold .type-header { border-left: 4px solid #ffd700; }
.tasks-section.silver .type-header { border-left: 4px solid #c0c0c0; }
.tasks-section.bronze .type-header { border-left: 4px solid #cd7f32; }
</style> 