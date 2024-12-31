<script setup>
import { ref, computed, watch } from 'vue';

// 从 localStorage 加载奖励列表
const savedRewards = localStorage.getItem('rewards');
const rewards = ref(savedRewards ? JSON.parse(savedRewards) : [
  // 使用 SpendCapybara.vue 中的初始奖励数据
  {
    id: 1,
    title: '额外的游戏时间（30分钟）',
    description: '在今天获得额外的30分钟游戏时间',
    cost: { type: 'bronze', amount: 5 }
  },
  // ... 其他奖励
]);

// 默认数量映射
const defaultAmounts = {
  diamond: 1,
  gold: 2,
  silver: 3,
  bronze: 5
};

// 新奖励表单
const newReward = ref({
  title: '',
  description: '',
  cost: {
    type: 'diamond',
    amount: defaultAmounts['diamond']
  }
});

// 编辑状态管理
const editingReward = ref(null);

// 折叠状态管理
const expandedTypes = ref({
  diamond: true,
  gold: true,
  silver: true,
  bronze: true
});

function toggleExpand(type) {
  expandedTypes.value[type] = !expandedTypes.value[type];
}

// 按类型分组的奖励
const groupedRewards = computed(() => {
  return {
    diamond: rewards.value.filter(r => r.cost.type === 'diamond'),
    gold: rewards.value.filter(r => r.cost.type === 'gold'),
    silver: rewards.value.filter(r => r.cost.type === 'silver'),
    bronze: rewards.value.filter(r => r.cost.type === 'bronze')
  };
});

// 监听类型变化，自动设置默认数量
watch(() => newReward.value.cost.type, (newType) => {
  if (!editingReward.value) {
    newReward.value.cost.amount = defaultAmounts[newType];
  }
}, { deep: false });

// 保存到 localStorage
watch(rewards, (newValue) => {
  localStorage.setItem('rewards', JSON.stringify(newValue));
}, { deep: true });

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

// 添加奖励
function addReward() {
  if (!newReward.value.title) {
    showMessage('请填写奖励标题');
    return;
  }

  rewards.value.push({
    id: Date.now(),
    title: newReward.value.title,
    description: newReward.value.description || '',
    cost: {
      type: newReward.value.cost.type,
      amount: newReward.value.cost.amount
    }
  });

  // 重置表单
  newReward.value = {
    title: '',
    description: '',
    cost: {
      type: newReward.value.cost.type,
      amount: defaultAmounts[newReward.value.cost.type]
    }
  };
  showMessage('奖励添加成功');
}

// 开始编辑
function startEdit(reward) {
  editingReward.value = reward.id;
  newReward.value = {
    title: reward.title,
    description: reward.description,
    cost: { ...reward.cost }
  };
}

// 保存编辑
function saveEdit() {
  if (!newReward.value.title) {
    showMessage('请填写奖励标题');
    return;
  }

  const index = rewards.value.findIndex(r => r.id === editingReward.value);
  if (index !== -1) {
    rewards.value[index] = {
      id: editingReward.value,
      title: newReward.value.title,
      description: newReward.value.description || '',
      cost: {
        type: newReward.value.cost.type,
        amount: newReward.value.cost.amount
      }
    };
    editingReward.value = null;
    // 重置表单
    newReward.value = {
      title: '',
      description: '',
      cost: {
        type: 'diamond',
        amount: defaultAmounts['diamond']
      }
    };
    showMessage('奖励修改成功');
  }
}

// 取消编辑
function cancelEdit() {
  editingReward.value = null;
  // 重置表单
  newReward.value = {
    title: '',
    description: '',
    cost: {
      type: 'diamond',
      amount: defaultAmounts['diamond']
    }
  };
}

// 删除奖励
function deleteReward(rewardId) {
  const index = rewards.value.findIndex(r => r.id === rewardId);
  if (index !== -1) {
    rewards.value.splice(index, 1);
    showMessage('奖励删除成功');
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
</script>

<template>
  <div class="reward-editor">
    <div v-if="message" class="message">{{ message }}</div>
    
    <form @submit.prevent="editingReward ? saveEdit() : addReward()" class="reward-form">
      <input 
        v-model="newReward.title"
        type="text"
        placeholder="奖励标题"
        class="input-field"
      >
      <textarea 
        v-model="newReward.description"
        placeholder="奖励描述（选填）"
        class="input-field"
      ></textarea>
      <div class="cost-group">
        <select 
          v-model="newReward.cost.type"
          class="select-field"
        >
          <option value="diamond">钻石卡皮巴拉</option>
          <option value="gold">黄金卡皮巴拉</option>
          <option value="silver">白银卡皮巴拉</option>
          <option value="bronze">青铜卡皮巴拉</option>
        </select>
        <input 
          type="number"
          v-model.number="newReward.cost.amount"
          min="1"
          class="input-field"
          placeholder="数量"
        >
      </div>
      <div class="button-group">
        <button type="submit" class="submit-btn">
          {{ editingReward ? '保存修改' : '添加奖励' }}
        </button>
        <button 
          v-if="editingReward"
          type="button"
          class="cancel-btn"
          @click="cancelEdit"
        >
          取消
        </button>
      </div>
    </form>

    <div class="rewards-list">
      <div v-for="(rewards, type) in groupedRewards" :key="type">
        <div class="type-header" @click="toggleExpand(type)">
          <h2>{{ getTypeName(type) }}奖励</h2>
          <span class="expand-icon">{{ expandedTypes[type] ? '▼' : '▶' }}</span>
        </div>
        <div v-show="expandedTypes[type]">
          <div v-for="reward in rewards" 
               :key="reward.id" 
               class="reward-item"
               :class="type">
            <div class="reward-content">
              <h3>{{ reward.title }}</h3>
              <p v-if="reward.description" class="description">{{ reward.description }}</p>
              <div class="cost">
                需要 {{ reward.cost.amount }} 个
                <span class="cost-type">{{ getTypeName(type) }}</span>
              </div>
            </div>
            <div class="reward-actions">
              <button class="edit-btn" @click="startEdit(reward)">编辑</button>
              <button class="delete-btn" @click="deleteReward(reward.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reward-editor {
  padding: 20px;
}

.reward-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.input-field {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.select-field {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background: white;
}

.cost-group {
  display: flex;
  gap: 12px;
}

.cost-group .input-field {
  width: 100px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.submit-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #9e9e9e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reward-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reward-item.diamond { border-left: 4px solid #00bcd4; }
.reward-item.gold { border-left: 4px solid #ffd700; }
.reward-item.silver { border-left: 4px solid #c0c0c0; }
.reward-item.bronze { border-left: 4px solid #cd7f32; }

.description {
  color: #666;
  margin: 8px 0;
}

.cost {
  color: #888;
  font-size: 0.9em;
}

.cost-type {
  font-weight: 500;
}

.edit-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.delete-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
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
</style> 