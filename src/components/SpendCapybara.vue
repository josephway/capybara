<script setup>
import { ref, computed, onMounted } from 'vue';
import { db } from '../db';

const props = defineProps({
  capybaras: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:capybaras']);

// 从数据库加载奖励列表
const rewards = ref([]);

onMounted(async () => {
  try {
    const savedRewards = await db.rewards.toArray();
    rewards.value = savedRewards;
  } catch (error) {
    console.error('Failed to load rewards:', error);
    rewards.value = [];
  }
});

// 按类型分组的奖励
const groupedRewards = computed(() => {
  return {
    diamond: rewards.value.filter(r => r.cost.type === 'diamond'),
    gold: rewards.value.filter(r => r.cost.type === 'gold'),
    silver: rewards.value.filter(r => r.cost.type === 'silver'),
    bronze: rewards.value.filter(r => r.cost.type === 'bronze')
  };
});

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

// 兑换奖励
async function exchangeReward(reward) {
  const { type, amount } = reward.cost;
  if (props.capybaras[type] >= amount) {
    try {
      const newAmount = props.capybaras[type] - amount;
      
      // 更新数据库
      await db.capybaras.put({ type, amount: newAmount });
      
      // 更新本地状态
      const newCapybaras = { ...props.capybaras };
      newCapybaras[type] = newAmount;
      emit('update:capybaras', newCapybaras);
      
      showMessage(`成功兑换：${reward.title}`);
    } catch (error) {
      console.error('Exchange failed:', error);
      showMessage('兑换失败，请重试');
    }
  } else {
    showMessage(`${getTypeName(type)}不足，无法兑换`);
  }
}

// 消息提示
const message = ref('');
function showMessage(msg) {
  message.value = msg;
  setTimeout(() => {
    message.value = '';
  }, 2000);
}

// 折叠状态管理
const expandedTypes = ref({
  bronze: false,
  silver: false,
  gold: false,
  diamond: false
});

function toggleExpand(type) {
  expandedTypes.value[type] = !expandedTypes.value[type];
}

// 计算可兑换的奖励数量（去重）
function getAvailableCount(rewards) {
  // 使用 Set 来存储可兑换奖励的标题，确保每个奖励只计算一次
  const availableTitles = new Set();
  
  rewards.forEach(reward => {
    if (props.capybaras[reward.cost.type] >= reward.cost.amount) {
      availableTitles.add(reward.title);
    }
  });
  
  return availableTitles.size;
}
</script>

<template>
  <div class="spend-container">
    <div v-for="(rewards, type) in groupedRewards" 
         :key="type" 
         class="rewards-section">
      <div class="type-header" @click="toggleExpand(type)">
        <h2>
          {{ getTypeName(type) }}商店 
          <span class="reward-count">
            ({{ getAvailableCount(rewards) }}/{{ rewards.length }})
          </span>
        </h2>
        <span class="expand-icon">{{ expandedTypes[type] ? '▼' : '▶' }}</span>
      </div>
      <div v-show="expandedTypes[type]" class="rewards-grid">
        <div v-for="reward in rewards" 
             :key="reward.id" 
             class="reward-card"
             :class="type">
          <h3>{{ reward.title }}</h3>
          <p class="description">{{ reward.description }}</p>
          <div class="cost">
            需要 {{ reward.cost.amount }} 个
            <span class="cost-type">{{ getTypeName(type) }}</span>
          </div>
          <div class="balance">
            当前拥有: {{ props.capybaras[type] }} 个
          </div>
          <button 
            @click="exchangeReward(reward)"
            class="exchange-btn"
            :disabled="props.capybaras[type] < reward.cost.amount"
          >
            兑换奖励
          </button>
        </div>
      </div>
    </div>
    
    <div class="message" v-if="message">{{ message }}</div>
  </div>
</template>

<style scoped>
.spend-container {
  padding: 20px;
}

.rewards-section {
  margin-bottom: 40px;
}

.type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.type-header:hover {
  background: #f5f5f5;
}

.expand-icon {
  font-size: 1.2em;
  color: #666;
}

.rewards-grid {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reward-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reward-card:hover {
  transform: translateY(-5px);
}

.reward-card.diamond { border-left: 4px solid #00bcd4; }
.reward-card.gold { border-left: 4px solid #ffd700; }
.reward-card.silver { border-left: 4px solid #c0c0c0; }
.reward-card.bronze { border-left: 4px solid #cd7f32; }

.description {
  color: #666;
  font-size: 0.9em;
  margin: 0;
}

.cost {
  margin-top: auto;
  color: #666;
}

.balance {
  color: #888;
  font-size: 0.9em;
}

.cost-type {
  font-weight: 500;
}

.exchange-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s;
  margin-top: 8px;
}

.exchange-btn:hover:not(:disabled) {
  background: #45a049;
}

.exchange-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rewards-grid {
    grid-template-columns: 1fr;
  }
}

.reward-count {
  font-size: 0.8em;
  color: #666;
  margin-left: 8px;
  font-weight: normal;
}
</style> 