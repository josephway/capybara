<script setup>
import { ref, computed, watch } from 'vue';

// 当前选中的日期
const selectedDate = ref(new Date('2024-12-23'));
// 当前显示的周的起始日期
const weekStartDate = ref(new Date('2024-12-23'));

// 从 localStorage 加载任务状态
const savedTasks = localStorage.getItem('tasks');
const tasks = ref(savedTasks ? JSON.parse(savedTasks) : [
  {
    id: 1,
    date: '2024-12-23',
    title: '完成数学作业',
    reward: { type: 'bronze', amount: 2 },
    completed: false
  },
  {
    id: 2,
    date: '2024-12-23',
    title: '整理房间',
    reward: { type: 'bronze', amount: 3 },
    completed: false
  },
  {
    id: 3,
    date: '2024-12-23',
    title: '背诵古诗',
    reward: { type: 'silver', amount: 1 },
    completed: false
  },
  {
    id: 4,
    date: '2024-12-24',
    title: '帮妈妈做家务',
    reward: { type: 'silver', amount: 2 },
    completed: false
  },
  {
    id: 5,
    date: '2024-12-24',
    title: '练习钢琴30分钟',
    reward: { type: 'gold', amount: 1 },
    completed: false
  },
  {
    id: 6,
    date: '2024-12-25',
    title: '英语口语练习',
    reward: { type: 'bronze', amount: 2 },
    completed: false
  },
  {
    id: 7,
    date: '2024-12-25',
    title: '阅读一章故事书',
    reward: { type: 'silver', amount: 1 },
    completed: false
  },
  {
    id: 8,
    date: '2024-12-26',
    title: '参加课外活动',
    reward: { type: 'gold', amount: 1 },
    completed: false
  },
  {
    id: 9,
    date: '2024-12-26',
    title: '完成科学实验',
    reward: { type: 'silver', amount: 2 },
    completed: false
  },
  {
    id: 10,
    date: '2024-12-27',
    title: '运动30分钟',
    reward: { type: 'bronze', amount: 2 },
    completed: false
  },
  {
    id: 11,
    date: '2024-12-27',
    title: '期末考试得满分',
    reward: { type: 'diamond', amount: 1 },
    completed: false
  },
  {
    id: 12,
    date: '2024-12-28',
    title: '写日记',
    reward: { type: 'bronze', amount: 1 },
    completed: false
  },
  {
    id: 13,
    date: '2024-12-28',
    title: '画一幅圣诞画',
    reward: { type: 'silver', amount: 1 },
    completed: false
  },
  {
    id: 14,
    date: '2024-12-29',
    title: '参加冬季才艺表演',
    reward: { type: 'diamond', amount: 1 },
    completed: false
  },
  {
    id: 15,
    date: '2024-12-29',
    title: '和家人一起散步',
    reward: { type: 'bronze', amount: 2 },
    completed: false
  }
]);

// 保存任务状态到 localStorage
watch(tasks, (newValue) => {
  localStorage.setItem('tasks', JSON.stringify(newValue));
}, { deep: true });

// 获取周的起始日期
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// 计算当前周的日期数组
const weekDates = computed(() => {
  const dates = [];
  const currentDate = new Date(weekStartDate.value);
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
});

// 切换到上一周
function previousWeek() {
  const newDate = new Date(weekStartDate.value);
  newDate.setDate(newDate.getDate() - 7);
  weekStartDate.value = newDate;
}

// 切换到下一周
function nextWeek() {
  const newDate = new Date(weekStartDate.value);
  newDate.setDate(newDate.getDate() + 7);
  weekStartDate.value = newDate;
}

// 选择日期
function selectDate(date) {
  selectedDate.value = date;
}

// 获取日期对应的任务
const selectedDateTasks = computed(() => {
  const dateStr = selectedDate.value.toISOString().split('T')[0];
  return tasks.value.filter(task => task.date === dateStr);
});

const emit = defineEmits(['reward-earned']);

// 完成任务
function completeTask(taskId) {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;
  
  // 切换任务状态
  task.completed = !task.completed;
  
  // 发送奖励变更事件，包含完成状态
  emit('reward-earned', task.reward, task.completed);
  
  // 显示相应消息
  if (task.completed) {
    showMessage(`完成任务！获得 ${task.reward.amount} 个${getTypeName(task.reward.type)}`);
  } else {
    showMessage(`取消完成任务，减少 ${task.reward.amount} 个${getTypeName(task.reward.type)}`);
  }
  
  // 保存到 localStorage
  localStorage.setItem('tasks', JSON.stringify(tasks.value));
}

// 添加获取类型名称函数
function getTypeName(type) {
  const names = {
    diamond: '钻石卡皮巴拉',
    gold: '黄金卡皮巴拉',
    silver: '白银卡皮巴拉',
    bronze: '青铜卡皮巴拉'
  };
  return names[type];
}

// 添加消息提示
const message = ref('');
function showMessage(msg) {
  message.value = msg;
  setTimeout(() => {
    message.value = '';
  }, 2000);
}

// 处理日期选择
function handleDateSelect(event) {
  const selectedDate = new Date(event.target.value);
  selectDate(selectedDate);
  weekStartDate.value = getWeekStartDate(selectedDate);
}
</script>

<template>
  <div class="earn-container">
    <!-- 周历视图 -->
    <div class="calendar">
      <div class="calendar-header">
        <button @click="previousWeek">&lt;</button>
        <input 
          type="date" 
          :value="selectedDate.toISOString().split('T')[0]"
          @change="handleDateSelect"
          class="date-picker"
        >
        <button @click="nextWeek">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div v-for="date in weekDates" 
             :key="date.toISOString()"
             :class="['calendar-day', {
               'selected': selectedDate.toDateString() === date.toDateString(),
               'today': new Date().toDateString() === date.toDateString()
             }]"
             @click="selectDate(date)">
          <div class="day-name">{{ date.toLocaleDateString('zh-CN', { weekday: 'short' }) }}</div>
          <div class="day-number">{{ date.getDate() }}</div>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-container">
      <h3>{{ selectedDate.toLocaleDateString() }} 的任务</h3>
      <div class="tasks-list">
        <div v-for="task in selectedDateTasks" 
             :key="task.id"
             :class="['task-item', { completed: task.completed }]">
          <label :class="task.reward.type">
            <input type="checkbox" 
                   :checked="task.completed"
                   @change="completeTask(task.id)">
            <span class="task-title">{{ task.title }}</span>
            <span class="task-reward">
              {{ task.reward.amount }} {{ getTypeName(task.reward.type) }}
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加消息提示组件 -->
  <div class="message" v-if="message">{{ message }}</div>
</template>

<style scoped>
.earn-container {
  padding: 20px;
}

.calendar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
}

.calendar-day:hover {
  background: #f5f5f5;
}

.calendar-day.selected {
  background: #e3f2fd;
  border-color: #2196F3;
}

.calendar-day.today {
  border-color: #4CAF50;
  font-weight: bold;
}

.tasks-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.task-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: all 0.3s ease;
}

.task-item:hover {
  background: #f5f5f5;
}

.task-item label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  width: 100%;
}

.task-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #999;
}

.task-reward {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f0f0f0;
  font-size: 0.9em;
}

/* 任务奖励类型颜色 */
.diamond .task-reward { 
  background: #e3f2fd;
  color: #00bcd4;
}

.gold .task-reward { 
  background: #fff8e1;
  color: #ffa000;
}

.silver .task-reward { 
  background: #f5f5f5;
  color: #757575;
}

.bronze .task-reward { 
  background: #fff3e0;
  color: #ef6c00;
}

/* 添加消息样式 */
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
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

.date-picker {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  flex: 1;
  max-width: 200px;
}

.date-picker:hover {
  border-color: #2196F3;
}

.date-picker:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}
</style> 