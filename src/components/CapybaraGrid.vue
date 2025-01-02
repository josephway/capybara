<template>
  <div class="capybara-grid">
    <div v-if="message" class="message">{{ message }}</div>
    
    <div class="grid">
      <!-- 钻石 -->
      <div class="capybara-cell diamond">
        <h3>钻石卡皮巴拉</h3>
        <div class="count-control">
          <button @click="updateAmount('diamond', 1)">+</button>
          <span>{{ capybaras.diamond }}</span>
          <button @click="updateAmount('diamond', -1)">-</button>
        </div>
        <div class="exchange-buttons single-button">
          <button class="exchange-btn down" @click="exchange('diamond', 'gold')">
            兑换为黄金 (1:10)
          </button>
        </div>
      </div>

      <!-- 黄金 -->
      <div class="capybara-cell gold">
        <h3>黄金卡皮巴拉</h3>
        <div class="count-control">
          <button @click="updateAmount('gold', 1)">+</button>
          <span>{{ capybaras.gold }}</span>
          <button @click="updateAmount('gold', -1)">-</button>
        </div>
        <div class="exchange-buttons">
          <button class="exchange-btn up" @click="exchangeUp('gold', 'diamond')">
            升级为钻石 (10:1)
          </button>
          <button class="exchange-btn down" @click="exchange('gold', 'silver')">
            兑换为白银 (1:10)
          </button>
        </div>
      </div>

      <!-- 白银 -->
      <div class="capybara-cell silver">
        <h3>白银卡皮巴拉</h3>
        <div class="count-control">
          <button @click="updateAmount('silver', 1)">+</button>
          <span>{{ capybaras.silver }}</span>
          <button @click="updateAmount('silver', -1)">-</button>
        </div>
        <div class="exchange-buttons">
          <button class="exchange-btn up" @click="exchangeUp('silver', 'gold')">
            升级为黄金 (10:1)
          </button>
          <button class="exchange-btn down" @click="exchange('silver', 'bronze')">
            兑换为青铜 (1:10)
          </button>
        </div>
      </div>

      <!-- 青铜 -->
      <div class="capybara-cell bronze">
        <h3>青铜卡皮巴拉</h3>
        <div class="count-control">
          <button @click="updateAmount('bronze', 1)">+</button>
          <span>{{ capybaras.bronze }}</span>
          <button @click="updateAmount('bronze', -1)">-</button>
        </div>
        <div class="exchange-buttons single-button">
          <button class="exchange-btn up" @click="exchangeUp('bronze', 'silver')">
            升级为白银 (10:1)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { db } from '../db';

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

// 手动更新数量
async function updateAmount(type, delta) {
  const newAmount = Math.max(0, props.capybaras[type] + delta);
  try {
    // 先更新数据库
    await db.capybaras.put({ type, amount: newAmount });
    // 再更新本地状态
    const newCapybaras = { ...props.capybaras };
    newCapybaras[type] = newAmount;
    emit('update:capybaras', newCapybaras);
  } catch (error) {
    console.error('Update failed:', error);
    showMessage('更新失败，请重试');
  }
}

// 向上升级
async function exchangeUp(from, to) {
  if (props.capybaras[from] >= 10) {
    try {
      const newCapybaras = { ...props.capybaras };
      newCapybaras[from] -= 10;
      newCapybaras[to] += 1;

      // 同时更新两种类型的数据
      await Promise.all([
        db.capybaras.put({ type: from, amount: newCapybaras[from] }),
        db.capybaras.put({ type: to, amount: newCapybaras[to] })
      ]);
      
      emit('update:capybaras', newCapybaras);
      showMessage(`成功将 10 个${getTypeName(from)}升级为 1 个${getTypeName(to)}`);
    } catch (error) {
      console.error('Exchange up failed:', error);
      showMessage('升级失败，请重试');
    }
  } else {
    showMessage(`需要 10 个${getTypeName(from)}才能升级`);
  }
}

// 向下兑换
async function exchange(from, to) {
  if (props.capybaras[from] >= 1) {
    try {
      const newCapybaras = { ...props.capybaras };
      newCapybaras[from] -= 1;
      newCapybaras[to] += 10;

      // 同时更新两种类型的数据
      await Promise.all([
        db.capybaras.put({ type: from, amount: newCapybaras[from] }),
        db.capybaras.put({ type: to, amount: newCapybaras[to] })
      ]);
      
      emit('update:capybaras', newCapybaras);
      showMessage(`成功将 1 个${getTypeName(from)}兑换为 10 个${getTypeName(to)}`);
    } catch (error) {
      console.error('Exchange down failed:', error);
      showMessage('兑换失败，请重试');
    }
  } else {
    showMessage(`${getTypeName(from)}数量不足，无法兑换`);
  }
}
</script>

<style scoped>
.capybara-grid {
  padding: 20px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1000;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
  padding: 15px;
  width: 100%;
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .capybara-grid {
    padding: 10px;
    min-height: auto;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 10px;
    margin: 0;
  }

  .capybara-cell {
    padding: 10px 10px 20px 10px;
    width: 100%;
    min-width: 0;
  }

  .count-control span {
    font-size: 2em;
    min-width: 60px;
  }

  .count-control button {
    width: 30px;
    height: 30px;
  }

  .exchange-btn {
    font-size: 0.75em;
    padding: 0 8px;
  }
}

/* 确保在更小的屏幕上也能正常显示 */
@media (max-width: 480px) {
  .capybara-grid {
    padding: 5px;
  }

  .grid {
    gap: 10px;
    padding: 5px;
  }

  .capybara-cell {
    padding: 8px 8px 16px 8px;
  }
}

.capybara-cell {
  background: white;
  border-radius: 16px;
  padding: 12px 12px 24px 12px;
  text-align: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.capybara-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.capybara-cell.diamond::before { background: #b9f2ff; }
.capybara-cell.gold::before { background: #ffd700; }
.capybara-cell.silver::before { background: #c0c0c0; }
.capybara-cell.bronze::before { background: #cd7f32; }

.capybara-cell:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.capybara-cell h3 {
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
  padding: 4px 0;
}

.diamond h3 { color: #00bcd4; }
.gold h3 { color: #ffa000; }
.silver h3 { color: #757575; }
.bronze h3 { color: #8d6e63; }

.count-control {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.count-control button {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 1.4em;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.count-control span {
  font-size: 2.5em;
  font-weight: bold;
  min-width: 80px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  order: 2;
}

.count-control button:first-child {
  order: 1;
}

.count-control button:last-child {
  order: 3;
}

.exchange-buttons {
  display: flex;
  flex-direction: row;
  gap: 6px;
  justify-content: center;
  margin: 6px 0 0 0;
  padding: 0;
}

.exchange-btn {
  height: 28px;
  margin: 0;
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 500;
  flex: 1;
  max-width: calc(50% - 3px);
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.exchange-btn.up {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #1976d2;
}

.exchange-btn.down {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  color: #f57c00;
  margin-top: 8px;
}

.exchange-btn:hover {
  filter: brightness(1.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.diamond .count-control span { color: #00bcd4; }
.gold .count-control span { color: #ffa000; }
.silver .count-control span { color: #757575; }
.bronze .count-control span { color: #8d6e63; }

.exchange-buttons.single-button {
  justify-content: center;
}

.exchange-buttons.single-button .exchange-btn {
  max-width: 80%;
}

.exchange-btn.up, .exchange-btn.down {
  margin: 0;
}
</style>