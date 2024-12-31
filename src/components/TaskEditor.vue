<script setup>
import { ref, watch } from 'vue';

// 从 localStorage 加载任务
const savedTasks = localStorage.getItem('tasks');
const tasks = ref(savedTasks ? JSON.parse(savedTasks) : []);

// 新任务表单
const newTask = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  reward: {
    type: 'bronze',
    amount: 1
  },
  repeat: 'none', // 新增：重复类型
  completed: false
});

// 保存任务到 localStorage
watch(tasks, (newValue) => {
  localStorage.setItem('tasks', JSON.stringify(newValue));
}, { deep: true });

// 添加任务
function addTask() {
  if (!newTask.value.title) {
    showMessage('请输入任务标题');
    return;
  }
  
  const baseTask = {
    id: Date.now(),
    title: newTask.value.title,
    reward: { ...newTask.value.reward },
    completed: false,
    repeat: newTask.value.repeat
  };

  if (newTask.value.repeat === 'daily') {
    // 添加未来30天的每日任务
    for (let i = 0; i < 30; i++) {
      const date = new Date(newTask.value.date);
      date.setDate(date.getDate() + i);
      tasks.value.push({
        ...baseTask,
        id: Date.now() + i,
        date: date.toISOString().split('T')[0]
      });
    }
  } else if (newTask.value.repeat === 'weekly') {
    // 添加未来4周的每周任务
    for (let i = 0; i < 4; i++) {
      const date = new Date(newTask.value.date);
      date.setDate(date.getDate() + i * 7);
      tasks.value.push({
        ...baseTask,
        id: Date.now() + i,
        date: date.toISOString().split('T')[0]
      });
    }
  } else {
    // 单次任务
    tasks.value.push({
      ...baseTask,
      date: newTask.value.date
    });
  }
  
  // 重置表单
  newTask.value.title = '';
  showMessage('任务添加成功');
}

// 删除任务
function deleteTask(taskId) {
  const index = tasks.value.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks.value.splice(index, 1);
    showMessage('任务删除成功');
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
      <div v-for="task in tasks" :key="task.id" class="task-item">
        <div class="task-info">
          <span class="task-date">{{ task.date }}</span>
          <span class="task-title">{{ task.title }}</span>
          <span class="task-repeat" v-if="task.repeat !== 'none'">
            {{ task.repeat === 'daily' ? '每日' : '每周' }}
          </span>
          <span :class="['task-reward', task.reward.type]">
            {{ task.reward.amount }} {{ task.reward.type }}
          </span>
        </div>
        <button @click="deleteTask(task.id)" class="delete-btn">删除</button>
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
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.task-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.task-date {
  color: #666;
  min-width: 100px;
}

.task-title {
  flex: 1;
}

.task-repeat {
  background: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.9em;
  color: #666;
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
</style> 