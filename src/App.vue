<template>
  <div class="app">
    <Sidebar v-model:currentView="currentView" />
    <main>
      <CapybaraGrid 
        v-if="currentView === 'honor'" 
        :capybaras="capybaras" 
        @update:capybaras="updateCapybaras"
      />
      <EarnCapybara v-if="currentView === 'earn'" @reward-earned="handleRewardEarned" />
      <SpendCapybara v-if="currentView === 'spend'" :capybaras="capybaras" />
      <TaskEditor v-if="currentView === 'task-editor'" />
      <RewardEditor v-if="currentView === 'reward-editor'" />
    </main>
  </div>
</template>

<script setup>
import CapybaraGrid from './components/CapybaraGrid.vue';
import Sidebar from './components/Sidebar.vue';
import EarnCapybara from './components/EarnCapybara.vue';
import TaskEditor from './components/TaskEditor.vue';
import SpendCapybara from './components/SpendCapybara.vue';
import RewardEditor from './components/RewardEditor.vue';
import { ref, onMounted } from 'vue';
import { db } from './db';

const currentView = ref('honor');
const capybaras = ref({
  diamond: 0,
  gold: 0,
  silver: 0,
  bronze: 0
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
  min-height: 100vh;
  overflow-x: hidden;
}

main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }

  main {
    padding: 10px;
    flex: 1;
    min-height: 0;
  }
}
</style>
