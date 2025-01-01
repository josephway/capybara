<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="/capybara.png" alt="Capybara Logo">
    </div>
    <nav>
      <button 
        @click="switchView('honor')"
        :class="{ active: currentView === 'honor' }"
      >
        荣誉墙
      </button>
      <button 
        @click="switchView('earn')"
        :class="{ active: currentView === 'earn' }"
      >
        赚取卡皮巴拉
      </button>
      <button 
        @click="switchView('spend')"
        :class="{ active: currentView === 'spend' }"
      >
        使用卡皮巴拉
      </button>
      <button 
        @click="switchView('task-editor')"
        :class="{ active: currentView === 'task-editor' }"
      >
        任务编辑器
      </button>
      <button 
        @click="switchView('reward-editor')"
        :class="{ active: currentView === 'reward-editor' }"
      >
        奖励编辑器
      </button>
    </nav>
  </aside>
</template>

<script setup>
const props = defineProps({
  currentView: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:currentView']);

function switchView(view) {
  emit('update:currentView', view);
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  background: white;
  min-height: 100vh;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

button {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  text-align: left;
  color: #666;
}

button:hover {
  background: #e0e0e0;
  transform: translateX(5px);
}

button.active {
  background: #ff6b6b;
  color: white;
  font-weight: bold;
}

button.active:hover {
  background: #ff5252;
}
</style>
