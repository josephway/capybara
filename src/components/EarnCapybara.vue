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
      <div v-for="task in filteredTasks" 
           :key="task.id" 
           class="task-item"
           :data-reward="task.reward.type">
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
            <div class="task-description" v-if="task.description">
              {{ task.description }}
            </div>
          </div>
        </div>
        <div class="task-reward">
          奖励: {{ task.reward.amount }} 个
          <span :class="task.reward.type">{{ task.reward.type }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { db } from '../db';

const tasks = ref([]);
const currentDate = ref(new Date().toISOString().split('T')[0]);
const today = new Date().toISOString().split('T')[0];
const emit = defineEmits(['reward-earned']);

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

// 检查日期是否有任务
function hasTaskOnDate(date) {
  const dayTasks = tasks.value.filter(task => task.date === date);
  if (dayTasks.length === 0) return false;
  
  // 返回该日期任务的所有类型
  return [...new Set(dayTasks.map(task => task.reward.type))];
}

// 过滤当前日期的任务
const filteredTasks = computed(() => {
  return tasks.value.filter(task => task.date === currentDate.value);
});

// 加载任务数据
async function loadTasks() {
  try {
    const dbTasks = await db.tasks.toArray();
    tasks.value = dbTasks;
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
}

// 更新任务状态
async function toggleTask(task) {
  try {
    const newCompleted = !task.completed;
    await db.tasks.update(task.id, { completed: newCompleted });
    task.completed = newCompleted;
    emit('reward-earned', task.reward, newCompleted);
  } catch (error) {
    console.error('Failed to update task:', error);
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

// 监听日期变化
watch(currentDate, () => {
  // 可以在这里添加日期变化时的额外逻辑
});

// 组件挂载时加载数据
onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.earn-capybara {
  padding: 30px;
  background: #f5f7fa;
  min-height: 100%;
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
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto 30px;
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
</style> 