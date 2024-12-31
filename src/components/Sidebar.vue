<template>
  <div class="sidebar">
    <div class="logo">
      <img src="/capybara.png" alt="Joanne&Capybara Logo">
    </div>
    <div class="nav-links">
      <a 
        href="#" 
        @click.prevent="$emit('change-view', 'honor')"
        :class="{ active: currentView === 'honor' }"
      >
        <span class="nav-icon">🏆</span>
        荣誉墙
      </a>
      <a 
        href="#" 
        @click.prevent="$emit('change-view', 'earn')"
        :class="{ active: currentView === 'earn' }"
      >
        <span class="nav-icon">📝</span>
        完成任务
      </a>
      <a 
        href="#" 
        @click.prevent="$emit('change-view', 'task-editor')"
        :class="{ active: currentView === 'task-editor' }"
      >
        <span class="nav-icon">✏️</span>
        编辑任务
      </a>
      <a 
        href="#" 
        @click.prevent="$emit('change-view', 'spend')"
        :class="{ active: currentView === 'spend' }"
      >
        <span class="nav-icon">🎁</span>
        兑换奖励
      </a>
      <a 
        href="#" 
        @click.prevent="$emit('change-view', 'reward-editor')"
        :class="{ active: currentView === 'reward-editor' }"
      >
        <span class="nav-icon">⚙️</span>
        编辑奖励
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentView: String
});
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
}

h1 {
  padding: 20px;
  margin: 0;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.nav-links {
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.nav-links a {
  padding: 12px 20px;
  text-decoration: none;
  color: #333;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.nav-links a:hover {
  background-color: #f5f5f5;
}

.nav-links a.active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.nav-icon {
  margin-right: 12px;
  font-size: 1.2em;
}

.logo {
  padding: 20px;
  margin: 0;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.logo img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
}
</style>
