<template>
  <div class="app">
    <header class="app-header">
      <h1>Joanne的卡皮巴拉奖励系统</h1>
    </header>
    <div class="app-content">
      <Sidebar 
        :currentView="currentView"
        @change="handleViewChange"
      />
      <main class="main-content">
        <template v-if="isAuthenticated || currentView === 'settings'">
          <component 
            :is="currentComponent"
            :capybaras="capybaras"
            @update:capybaras="updateCapybaras"
            @reward-earned="handleRewardEarned"
          />
        </template>
        <template v-else>
          <div class="auth-message">
            请先在设置中配置正确的 API Key
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Sidebar from './components/Sidebar.vue';
import CapybaraGrid from './components/CapybaraGrid.vue';
import EarnCapybara from './components/EarnCapybara.vue';
import SpendCapybara from './components/SpendCapybara.vue';
import TaskEditor from './components/TaskEditor.vue';
import RewardEditor from './components/RewardEditor.vue';
import Settings from './components/Settings.vue';
import { api } from './api/client';

const currentView = ref('honor');
const capybaras = ref({
  bronze: 0,
  silver: 0,
  gold: 0,
  diamond: 0
});

const isAuthenticated = computed(() => {
  return !!localStorage.getItem('api_key');
});

const currentComponent = computed(() => {
  const components = {
    honor: CapybaraGrid,
    earn: EarnCapybara,
    spend: SpendCapybara,
    tasks: TaskEditor,
    rewards: RewardEditor,
    settings: Settings
  };
  return components[currentView.value];
});

function handleViewChange(view) {
  console.log('Current view:', view);
  console.log('Is authenticated:', isAuthenticated.value);
  console.log('Current capybaras:', capybaras);
  
  // 直接设置视图，因为已经通过认证
  currentView.value = view;
}

function handleAuthSuccess(token) {
  api.setToken(token);
  isAuthenticated.value = true;
  // 在认证成功后，可以加载初始数据
  loadCapybaras();
}

async function loadCapybaras() {
  try {
    const data = await api.getCapybaras();
    capybaras.value = data;
  } catch (error) {
    // 错误处理
  }
}

function updateCapybaras(newValue) {
  capybaras.value = newValue;
}

function handleRewardEarned(reward) {
  const { type, amount } = reward;
  capybaras.value[type] = (capybaras.value[type] || 0) + amount;
  
  api.updateCapybaras(capybaras.value).catch(() => {
    // 错误处理
  });
}

onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      const data = await api.getCapybaras();
      capybaras.value = data;
    } catch (error) {
      console.error('Failed to load capybaras:', error);
    }
  }
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.app-header {
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.app-content {
  flex: 1;
  display: flex;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.auth-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
