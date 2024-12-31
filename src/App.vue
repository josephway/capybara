<script setup>
import CapybaraGrid from './components/CapybaraGrid.vue';
import Sidebar from './components/Sidebar.vue';
import EarnCapybara from './components/EarnCapybara.vue';
import TaskEditor from './components/TaskEditor.vue';
import SpendCapybara from './components/SpendCapybara.vue';
import RewardEditor from './components/RewardEditor.vue';
import { ref, watch, computed } from 'vue';

const currentView = ref('honor');

// 将卡皮巴拉状态提升到 App 组件并从 localStorage 加载
const capybaras = ref(JSON.parse(localStorage.getItem('capybaras')) || {
  diamond: 0,
  gold: 0,
  silver: 0,
  bronze: 0
});

// 保存卡皮巴拉状态到 localStorage
watch(capybaras, (newValue) => {
  localStorage.setItem('capybaras', JSON.stringify(newValue));
}, { deep: true });

// 处理任务完成后的奖励
function handleRewardEarned(reward, isCompleted) {
  if (isCompleted) {
    capybaras.value[reward.type] += reward.amount;
  } else {
    capybaras.value[reward.type] = Math.max(0, capybaras.value[reward.type] - reward.amount);
  }
}

// 根据当前视图返回对应的组件
const currentComponent = computed(() => {
  switch (currentView.value) {
    case 'honor':
      return CapybaraGrid;
    case 'earn':
      return EarnCapybara;
    case 'task-editor':
      return TaskEditor;
    case 'spend':
      return SpendCapybara;
    case 'reward-editor':
      return RewardEditor;
    default:
      return CapybaraGrid;
  }
});
</script>

<template>
  <div class="app">
    <Sidebar :currentView="currentView" @change-view="currentView = $event" />
    <div class="main-content">
      <div class="header">
        <h1>Joanne的卡皮巴拉奖励系统</h1>
      </div>
      <component 
        :is="currentComponent" 
        v-model:capybaras="capybaras"
        @reward-earned="handleRewardEarned"
      />
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
}

.app {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0 0 20px 0;
  font-size: 32px;
  color: #ff6b6b;
  text-align: center;
  font-family: "Comic Sans MS", "手写体", cursive;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.2);
  letter-spacing: 2px;
  padding: 10px;
  background: linear-gradient(120deg, #ffd1d1 0%, #fff5f5 100%);
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
</style>
