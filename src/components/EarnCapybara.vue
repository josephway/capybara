<template>
  <div class="earn-capybara">
    <div class="calendar">
      <div class="calendar-header">
        <button @click="changeWeek(-1)">上一周</button>
        <div class="date-selector">
          <input 
            type="date" 
            v-model="currentDate"
            :min="'2024-01-01'"
            :max="'2024-12-31'"
          >
        </div>
        <button @click="changeWeek(1)">下一周</button>
      </div>
      <div class="weekdays">
        <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">
          {{ day }}
        </div>
      </div>
      <div class="days">
        <div v-for="day in weekDays" 
             :key="day.date" 
             class="day"
             :class="{ 
               'selected': day.date === currentDate,
               'today': day.date === today
             }"
             @click="selectDate(day.date)">
          <span class="date-number">{{ new Date(day.date).getDate() }}</span>
          <div class="task-indicators" v-if="day.hasTask">
            <div v-for="type in day.taskTypes" 
                 :key="type"
                 class="task-indicator"
                 :class="type">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="task-list">
      <div v-if="Object.values(tasksByType).every(tasks => tasks.length === 0)" 
           class="no-tasks">
        当天没有任务
      </div>
      <div v-else
           v-for="(tasks, type) in tasksByType" 
           :key="type" 
           class="tasks-section"
           :class="type">
        <div class="type-header" @click="toggleExpand(type)">
          <div class="header-content">
            <h3>{{ getTypeName(type) }}</h3>
            <span class="task-count">({{ tasks.length }})</span>
          </div>
          <span class="toggle-icon">{{ expandedTypes[type] ? '▼' : '▶' }}</span>
        </div>
        
        <div v-show="expandedTypes[type]" class="tasks-group">
          <div v-for="task in tasks" 
               :key="task.id" 
               class="task-item"
               :class="{ 'has-tooltip': task.description }"
               :data-tooltip="task.description">
            <div class="task-content">
              <input
                type="checkbox"
                :checked="task.completed"
                @change="toggleTask(task)"
              >
              <div class="task-text">
                <span :class="{ completed: task.completed }">
                  {{ task.title }}
                </span>
              </div>
            </div>
            <div class="task-reward">
              奖励: {{ task.reward.amount }} 个
              <span :class="task.reward.type">{{ getTypeName(task.reward.type) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api/client';

const props = defineProps({
  capybaras: Object
});

const emit = defineEmits(['reward-earned']);
const currentDate = ref(new Date().toISOString().split('T')[0]);
const tasks = ref([]);
const message = ref('');

// 计算当前周的日期
const weekDays = computed(() => {
  const days = [];
  const current = new Date(currentDate.value);
  const firstDayOfWeek = new Date(current);
  firstDayOfWeek.setDate(current.getDate() - current.getDay());

  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const taskTypes = hasTaskOnDate(dateStr);
    days.push({
      date: dateStr,
      hasTask: taskTypes,
      taskTypes: taskTypes
    });
  }
  
  return days;
});

// 检查指定日期是否有任务
function hasTaskOnDate(date) {
  const dayTasks = tasks.value.filter(task => task.date === date);
  if (dayTasks.length === 0) return false;
  
  // 返回该日期所有任务的奖励类型（去重）
  return [...new Set(dayTasks.map(task => task.reward.type))];
}

// 获取指定日期的任务
const tasksForDate = computed(() => {
  console.log('Computing tasks for date:', currentDate.value);
  console.log('Available tasks:', tasks.value);
  return tasks.value.filter(task => task.date === currentDate.value);
});

// 更新任务状态
async function toggleTask(task) {
  try {
    const updatedTask = {
      ...task,
      completed: !task.completed
    };

    await api.updateTask(task.id, updatedTask);
    
    // 添加日志
    console.log('Task toggle:', {
      taskId: task.id,
      wasCompleted: task.completed,
      nowCompleted: updatedTask.completed,
      reward: task.reward
    });

    // 更新任务状态时同时处理奖励
    if (updatedTask.completed) {
      // 完成任务时增加奖励
      console.log('Adding reward:', task.reward);
      emit('reward-earned', task.reward);
    } else {
      // 取消完成时减少奖励
      const negativeReward = {
        type: task.reward.type,
        amount: -task.reward.amount
      };
      console.log('Removing reward:', negativeReward);
      emit('reward-earned', negativeReward);
    }
    
    await loadTasks();
  } catch (error) {
    console.error('Failed to update task:', error);
    showMessage('更新任务状态失败');
  }
}

// 加载任务
async function loadTasks() {
  try {
    console.log('Loading tasks in EarnCapybara...');
    const allTasks = await api.getTasks();
    console.log('Loaded tasks:', allTasks);
    tasks.value = allTasks || [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    showMessage('加载任务失败');
    tasks.value = [];
  }
}

// 选择日期
function selectDate(date) {
  currentDate.value = date;
}

// 切换周
function changeWeek(offset) {
  const date = new Date(currentDate.value);
  date.setDate(date.getDate() + (offset * 7));
  currentDate.value = date.toISOString().split('T')[0];
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

function showMessage(text) {
  message.value = text;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

// 添加 filteredTasks 计算属性
const filteredTasks = computed(() => {
  return tasks.value.filter(task => task.date === currentDate.value);
});

// 添加折叠状态管理
const expandedTypes = ref({
  diamond: true,
  gold: true,
  silver: true,
  bronze: true
});

// 按类型分组的任务
const tasksByType = computed(() => {
  const groups = {
    diamond: [],
    gold: [],
    silver: [],
    bronze: []
  };
  
  filteredTasks.value.forEach(task => {
    if (groups[task.reward.type]) {
      groups[task.reward.type].push(task);
    }
  });
  
  return groups;
});

// 切换折叠状态
function toggleExpand(type) {
  expandedTypes.value[type] = !expandedTypes.value[type];
}

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.earn-capybara {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .earn-capybara {
    padding: 15px;
  }

  .calendar {
    padding: 15px;
  }

  .weekdays {
    font-size: 0.9em;
  }

  .day {
    font-size: 1em;
  }

  .task-item {
    padding: 15px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .task-content {
    font-size: 1em;
  }

  .task-reward {
    font-size: 0.9em;
    width: 100%;
    justify-content: flex-end;
  }
}

.calendar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-header button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #f0f4f8;
  color: #2196f3;
  font-size: 1.1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-header button:hover {
  background: #e3f2fd;
  transform: translateY(-2px);
}

.date-selector input {
  padding: 10px 15px;
  border: 2px solid #e3f2fd;
  border-radius: 8px;
  font-size: 1.1em;
  color: #2196f3;
  cursor: pointer;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
  color: #666;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 2px solid #f0f4f8;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

.day:hover {
  background: #f8fafc;
  transform: translateY(-2px);
}

.day.selected {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
}

.day.today {
  font-weight: 700;
  color: #2196f3;
}

.task-indicator {
  width: 6px;
  height: 6px;
  background: #2196f3;
  border-radius: 50%;
  margin-top: 4px;
}

/* 任务列表样式 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 800px;
  margin: 0 auto;
}

.task-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  border-left: 4px solid #2196f3;
}

.task-item:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.task-content {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.2em;
}

.task-content input[type="checkbox"] {
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.completed {
  text-decoration: line-through;
  color: #9e9e9e;
}

.task-reward {
  font-size: 1.1em;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 奖励类型颜色 */
.bronze { 
  color: #cd7f32;
  font-weight: 600;
}

.silver { 
  color: #808080;
  font-weight: 600;
}

.gold { 
  color: #ffd700;
  font-weight: 600;
}

.diamond { 
  color: #b9f2ff;
  font-weight: 600;
}

/* 根据奖励类型设置任务边框颜色 */
.task-item[data-reward="bronze"] { border-left-color: #cd7f32; }
.task-item[data-reward="silver"] { border-left-color: #808080; }
.task-item[data-reward="gold"] { border-left-color: #ffd700; }
.task-item[data-reward="diamond"] { border-left-color: #b9f2ff; }

.task-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-description {
  font-size: 0.9em;
  color: #666;
  margin-left: 2px;
}

.has-tooltip {
  position: relative;
}

.has-tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: 100%;
  margin-bottom: 5px;
  background: rgba(0, 0, 0, 0.8);
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
  bottom: 100%;
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

/* 添加无任务提示的样式 */
.no-tasks {
  text-align: center;
  padding: 20px;
  color: #666;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 添加新的分组样式 */
.tasks-section {
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.type-header {
  padding: 15px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #edf2f7;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-content h3 {
  margin: 0;
  font-size: 1.1em;
  color: #2d3748;
}

.task-count {
  color: #718096;
  font-size: 0.9em;
}

.toggle-icon {
  color: #718096;
  font-size: 0.9em;
}

.tasks-group {
  padding: 10px;
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
.tasks-section.diamond .type-header { border-left: 4px solid #b9f2ff; }
.tasks-section.gold .type-header { border-left: 4px solid #ffd700; }
.tasks-section.silver .type-header { border-left: 4px solid #808080; }
.tasks-section.bronze .type-header { border-left: 4px solid #cd7f32; }
</style> 