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
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.logo {
  padding: 0 20px 20px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  padding: 5px;
  background: white;
  box-sizing: border-box;
  display: block;
  flex-shrink: 0;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 10px;
}

nav button {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 1em;
  text-align: left;
  transition: all 0.2s;
}

nav button:hover {
  background: #f0f4f8;
}

nav button.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    padding: 10px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    padding: 0 10px;
  }

  .logo img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  nav {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
    flex: 1;
  }

  nav button {
    padding: 8px 12px;
    font-size: 0.9em;
  }
}

@media (max-width: 480px) {
  .sidebar {
    flex-direction: column;
    gap: 10px;
  }

  nav {
    width: 100%;
    justify-content: center;
  }
}
</style>
