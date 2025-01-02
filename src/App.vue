<template>
  <div class="app">
    <header class="app-header">
      <h1>Joanne的卡皮巴拉</h1>
    </header>
    <div class="app-content">
      <Sidebar 
        :currentView="currentView"
        @update:currentView="handleViewChange"
      />
      <main>
        <component 
          :is="currentComponent"
          v-model:capybaras="capybaras"
          @reward-earned="handleRewardEarned"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import CapybaraGrid from './components/CapybaraGrid.vue';
import Sidebar from './components/Sidebar.vue';
import EarnCapybara from './components/EarnCapybara.vue';
import TaskEditor from './components/TaskEditor.vue';
import SpendCapybara from './components/SpendCapybara.vue';
import RewardEditor from './components/RewardEditor.vue';
import { ref, computed, onMounted } from 'vue';
import { db } from './db';

const currentView = ref('honor');
const capybaras = ref({
  diamond: 0,
  gold: 0,
  silver: 0,
  bronze: 0
});

// 添加计算属性来确定当前显示的组件
const currentComponent = computed(() => {
  const components = {
    honor: CapybaraGrid,
    earn: EarnCapybara,
    spend: SpendCapybara,
    'task-editor': TaskEditor,
    'reward-editor': RewardEditor
  };
  return components[currentView.value];
});

// 加载卡皮巴拉数据
async function loadCapybaras() {
  try {
    const results = await db.capybaras.toArray();
    const capybaraData = {
      diamond: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      ...results.reduce((acc, curr) => {
        acc[curr.type] = curr.amount || 0;
        return acc;
      }, {})
    };
    capybaras.value = capybaraData;
  } catch (error) {
    console.error('Failed to load capybaras:', error);
    capybaras.value = {
      diamond: 0,
      gold: 0,
      silver: 0,
      bronze: 0
    };
  }
}

// 更新卡皮巴拉数据
async function updateCapybaras(newCapybaras) {
  try {
    // 更新所有变化的值
    const updates = Object.entries(newCapybaras).map(([type, amount]) => {
      return db.capybaras.put({ type, amount: Number(amount) });
    });
    
    await Promise.all(updates);
    capybaras.value = newCapybaras;
  } catch (error) {
    console.error('Failed to update capybaras:', error);
  }
}

// 处理任务完成后的奖励
async function handleRewardEarned(reward, isCompleted) {
  const newAmount = isCompleted 
    ? capybaras.value[reward.type] + reward.amount
    : Math.max(0, capybaras.value[reward.type] - reward.amount);

  const newCapybaras = { ...capybaras.value };
  newCapybaras[reward.type] = newAmount;
  await updateCapybaras(newCapybaras);
}

// 组件挂载时加载数据
onMounted(() => {
  loadCapybaras();
});

function handleViewChange(view) {
  currentView.value = view;
}
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.app-header {
  background: #1976d2;
  color: white;
  padding: 10px 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5em;
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  width: 100%;
  display: flex;
  justify-content: center;
}

main > * {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-content {
    flex-direction: column;
  }

  main {
    padding: 10px;
    flex: 1;
    min-height: 0;
  }
}
</style>
