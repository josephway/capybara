<template>
  <div class="spend-capybara">
    <div class="rewards-container">
      <div v-for="type in ['diamond', 'gold', 'silver', 'bronze']" 
           :key="type" 
           class="reward-group">
        <div class="group-header" 
             :class="type"
             @click="toggleGroup(type)">
          <div class="header-content">
            <h3>{{ getTypeName(type) }}</h3>
            <span class="capybara-count">拥有数：{{ props.capybaras[type] || 0 }}</span>
            <span class="reward-stats">
              可兑数：{{ getAffordableCount(type) }}/{{ getTotalCount(type) }}
            </span>
          </div>
          <span class="toggle-icon">{{ groupStates[type] ? '▼' : '▶' }}</span>
        </div>
        
        <div class="reward-items" v-show="groupStates[type]">
          <div v-if="!rewardsByType[type] || rewardsByType[type].length === 0" 
               class="no-rewards">
            暂无可用奖励
          </div>
          <div v-else
               v-for="reward in rewardsByType[type]" 
               :key="reward.id" 
               class="reward-item"
               :class="'has-tooltip'"
               :data-tooltip="reward.description || '暂无描述'">
            <div class="reward-content">
              <span class="reward-title">{{ reward.title }}</span>
            </div>
            <div class="reward-cost">
              <span class="cost-amount">{{ reward.cost.amount }}个</span>
              <button @click="exchangeReward(reward)" 
                      :disabled="!canAfford(reward)"
                      class="exchange-button"
                      :class="type">
                兑换
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="message" class="message">{{ message }}</div>

    <div class="exchanged-rewards">
      <div class="exchanged-header" @click="toggleExchangedList">
        <h3>已兑换奖励</h3>
        <span class="toggle-icon">{{ showExchanged ? '▼' : '▶' }}</span>
      </div>
      
      <div v-show="showExchanged" class="exchanged-list">
        <div v-if="exchangedRewards.length === 0" class="no-exchanged">
          暂无兑换记录
        </div>
        <div v-else v-for="record in exchangedRewards" 
             :key="record.id" 
             class="exchanged-item"
             :class="record.reward.cost.type">
          <div class="exchanged-content">
            <span class="reward-title">{{ record.reward.title }}</span>
            <span class="exchange-info">
              {{ record.reward.cost.amount }}个{{ getTypeName(record.reward.cost.type) }}
            </span>
          </div>
          <div class="exchange-date">
            {{ formatDate(record.exchangeDate) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client';

const props = defineProps({
  capybaras: {
    type: Object,
    required: true
  }
});

const rewards = ref([]);
const rewardsByType = ref({});
const message = ref('');
const groupStates = ref({
  diamond: true,
  gold: true,
  silver: true,
  bronze: true
});

const showExchanged = ref(false);
const exchangedRewards = ref([]);

// 加载奖励列表
async function loadRewards() {
  try {
    const data = await api.getRewards();
    rewards.value = data;
    
    // 按类型分组
    rewardsByType.value = data.reduce((acc, reward) => {
      const type = reward.cost.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(reward);
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to load rewards:', error);
    showMessage('加载奖励失败，请重试');
  }
}

function toggleGroup(type) {
  groupStates.value[type] = !groupStates.value[type];
}

function getTypeName(type) {
  const names = {
    diamond: '钻石卡皮巴拉',
    gold: '黄金卡皮巴拉',
    silver: '白银卡皮巴拉',
    bronze: '青铜卡皮巴拉'
  };
  return names[type] || type;
}

function getTotalCount(type) {
  return rewardsByType.value[type]?.length || 0;
}

function getAffordableCount(type) {
  return rewardsByType.value[type]?.filter(reward => 
    reward.cost.amount <= (props.capybaras[type] || 0)
  ).length || 0;
}

function canAfford(reward) {
  return (props.capybaras[reward.cost.type] || 0) >= reward.cost.amount;
}

async function exchangeReward(reward) {
  try {
    await api.exchangeReward(reward.id);
    showMessage('兑换成功');
    await loadRewards();
    await loadExchangedRewards();
  } catch (error) {
    console.error('Failed to exchange reward:', error);
    showMessage('兑换失败，请重试');
  }
}

function showMessage(text) {
  message.value = text;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

// 切换已兑换列表显示状态
function toggleExchangedList() {
  showExchanged.value = !showExchanged.value;
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}

// 加载已兑换奖励
async function loadExchangedRewards() {
  try {
    const records = await api.getExchangedRewards();
    exchangedRewards.value = records;
  } catch (error) {
    console.error('Failed to load exchanged rewards:', error);
    showMessage('加载兑换记录失败');
  }
}

onMounted(() => {
  loadRewards();
  loadExchangedRewards();
});
</script>

<style scoped>
.spend-capybara {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.rewards-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reward-group {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 4px solid transparent;
}

.group-header:hover {
  background-color: #f5f5f5;
}

.group-header.diamond { border-left-color: #b9f2ff; }
.group-header.gold { border-left-color: #ffd700; }
.group-header.silver { border-left-color: #808080; }
.group-header.bronze { border-left-color: #cd7f32; }

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-content h3 {
  font-size: 1.2em;
  margin: 0;
  font-weight: 500;
}

.capybara-count {
  color: #666;
  font-size: 0.95em;
  white-space: nowrap;
}

.reward-stats {
  color: #666;
  font-size: 0.95em;
  white-space: nowrap;
}

.toggle-icon {
  color: #666;
  transition: transform 0.2s;
}

.reward-items {
  border-top: 1px solid #eee;
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

.reward-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.reward-item:last-child {
  border-bottom: none;
}

.reward-item:hover {
  background-color: #f9f9f9;
}

.reward-title {
  font-size: 1.1em;
  color: #333;
}

.reward-cost {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cost-amount {
  color: #666;
  font-size: 0.95em;
}

.exchange-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  transition: all 0.2s;
  color: white;
  min-width: 80px;
}

.exchange-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.exchange-button:active:not(:disabled) {
  transform: translateY(0);
}

.exchange-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 不同类型的按钮样式 */
.exchange-button.diamond {
  background: linear-gradient(135deg, #b9f2ff 0%, #86e3ff 100%);
  color: #2a4957;
}

.exchange-button.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffb900 100%);
  color: #5c4500;
}

.exchange-button.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #8e8e8e 100%);
  color: white;
}

.exchange-button.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #a66529 100%);
  color: white;
}

/* 按钮禁用状态的特殊样式 */
.exchange-button:disabled {
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}

.no-rewards {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* 工具提示 */
.has-tooltip {
  position: relative;
}

.has-tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 5px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9em;
  white-space: pre-wrap;
  max-width: 250px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* 消息提示 */
.message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9em;
  z-index: 1000;
}

@media (max-width: 768px) {
  .spend-capybara {
    padding: 15px;
  }
  
  .reward-item {
    padding: 10px 15px;
  }
  
  .reward-title {
    font-size: 1em;
  }
}

.exchanged-rewards {
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.exchanged-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  cursor: pointer;
  border-bottom: 1px solid #edf2f7;
}

.exchanged-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #2d3748;
}

.exchanged-list {
  padding: 10px;
  animation: slideDown 0.3s ease-out;
}

.exchanged-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #edf2f7;
}

.exchanged-item:last-child {
  border-bottom: none;
}

.exchanged-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reward-title {
  font-weight: 500;
}

.exchange-info {
  font-size: 0.9em;
  color: #666;
}

.exchange-date {
  color: #888;
  font-size: 0.9em;
}

.no-exchanged {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* 奖励类型的颜色标记 */
.exchanged-item.bronze { border-left: 4px solid #cd7f32; }
.exchanged-item.silver { border-left: 4px solid #808080; }
.exchanged-item.gold { border-left: 4px solid #ffd700; }
.exchanged-item.diamond { border-left: 4px solid #b9f2ff; }
</style>