<script setup>
import { ref } from 'vue';

const props = defineProps({
  capybaras: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:capybaras']);

// 显示提示信息
const message = ref('');
const showMessage = (msg) => {
  message.value = msg;
  setTimeout(() => {
    message.value = '';
  }, 2000);
};

// 向下兑换
function exchange(from, to) {
  if (props.capybaras[from] >= 1) {
    const newCapybaras = { ...props.capybaras };
    newCapybaras[from]--;
    newCapybaras[to] += 10;
    emit('update:capybaras', newCapybaras);
    showMessage(`成功将 1 个${getTypeName(from)}兑换为 10 个${getTypeName(to)}`);
  } else {
    showMessage(`${getTypeName(from)}数量不足，无法兑换`);
  }
}

// 向上升级
function exchangeUp(from, to) {
  if (props.capybaras[from] >= 10) {
    const newCapybaras = { ...props.capybaras };
    newCapybaras[from] -= 10;
    newCapybaras[to] += 1;
    emit('update:capybaras', newCapybaras);
    showMessage(`成功将 10 个${getTypeName(from)}升级为 1 个${getTypeName(to)}`);
  } else {
    showMessage(`需要 10 个${getTypeName(from)}才能升级为${getTypeName(to)}`);
  }
}

// 获取类型名称
function getTypeName(type) {
  const names = {
    diamond: '钻石卡皮巴拉',
    gold: '黄金卡皮巴拉',
    silver: '白银卡皮巴拉',
    bronze: '青铜卡皮巴拉'
  };
  return names[type];
}

function increment(type) {
  const newCapybaras = { ...props.capybaras };
  newCapybaras[type]++;
  emit('update:capybaras', newCapybaras);
}

function decrement(type) {
  if (props.capybaras[type] > 0) {
    const newCapybaras = { ...props.capybaras };
    newCapybaras[type]--;
    emit('update:capybaras', newCapybaras);
  }
}
</script>

<template>
  <div class="capybara-container">
    <div class="message" v-if="message">{{ message }}</div>
    <div class="capybara-grid">
      <div class="capybara-cell diamond">
        <h3>钻石卡皮巴拉</h3>
        <div class="count">{{ props.capybaras.diamond }}</div>
        <div class="button-group">
          <button @click="increment('diamond')">+</button>
          <button @click="decrement('diamond')">-</button>
        </div>
        <button class="exchange-btn" @click="exchange('diamond', 'gold')">
          兑换为黄金 (1:10)
        </button>
      </div>
      <div class="capybara-cell gold">
        <h3>黄金卡皮巴拉</h3>
        <div class="count">{{ props.capybaras.gold }}</div>
        <div class="button-group">
          <button @click="increment('gold')">+</button>
          <button @click="decrement('gold')">-</button>
        </div>
        <button class="exchange-btn" @click="exchange('gold', 'silver')">
          兑换为白银 (1:10)
        </button>
        <button class="upgrade-btn" @click="exchangeUp('gold', 'diamond')">
          升级为钻石 (10:1)
        </button>
      </div>
      <div class="capybara-cell silver">
        <h3>白银卡皮巴拉</h3>
        <div class="count">{{ props.capybaras.silver }}</div>
        <div class="button-group">
          <button @click="increment('silver')">+</button>
          <button @click="decrement('silver')">-</button>
        </div>
        <button class="exchange-btn" @click="exchange('silver', 'bronze')">
          兑换为青铜 (1:10)
        </button>
        <button class="upgrade-btn" @click="exchangeUp('silver', 'gold')">
          升级为黄金 (10:1)
        </button>
      </div>
      <div class="capybara-cell bronze">
        <h3>青铜卡皮巴拉</h3>
        <div class="count">{{ props.capybaras.bronze }}</div>
        <div class="button-group">
          <button @click="increment('bronze')">+</button>
          <button @click="decrement('bronze')">-</button>
        </div>
        <button class="upgrade-btn" @click="exchangeUp('bronze', 'silver')">
          升级为白银 (10:1)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.capybara-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.capybara-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 20px;
}

.capybara-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  min-height: 250px;
}

.capybara-cell:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.diamond {
  background: linear-gradient(135deg, #b9f2ff 0%, #e3fbff 100%);
  border: 2px solid #7ae7ff;
}

.gold {
  background: linear-gradient(135deg, #ffd700 0%, #fff5cc 100%);
  border: 2px solid #ffcc00;
}

.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #f5f5f5 100%);
  border: 2px solid #a9a9a9;
}

.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #ffdab9 100%);
  border: 2px solid #b8860b;
}

.count {
  font-size: 48px;
  font-weight: bold;
  margin: 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  min-width: 80px;
}

.exchange-btn, .upgrade-btn {
  width: 100%;
  margin: 5px 0;
  padding: 10px;
}

.exchange-btn {
  background-color: #4CAF50;
  color: white;
}

.upgrade-btn {
  background-color: #2196F3;
  color: white;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

h3 {
  font-size: 1.5em;
  margin: 0;
  text-align: center;
}

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

/* 响应式设计 */
@media (max-width: 768px) {
  .capybara-grid {
    grid-template-columns: 1fr;
  }
}
</style>