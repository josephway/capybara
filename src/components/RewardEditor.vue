<template>
  <div class="reward-editor">
    <div v-if="message" class="message">{{ message }}</div>
    
    <!-- 添加/编辑表单 -->
    <div class="reward-form">
      <h2>{{ editingReward ? '编辑奖励' : '添加新奖励' }}</h2>
      <div class="form-group">
        <input 
          type="text" 
          v-model="newReward.title" 
          placeholder="奖励标题"
          class="input-field"
        >
        <textarea 
          v-model="newReward.description"
          placeholder="奖励描述（选填）"
          class="input-field"
          rows="3"
        ></textarea>
        <div class="cost-group">
          <select v-model="newReward.cost.type" class="input-field">
            <option value="bronze">青铜卡皮巴拉</option>
            <option value="silver">白银卡皮巴拉</option>
            <option value="gold">黄金卡皮巴拉</option>
            <option value="diamond">钻石卡皮巴拉</option>
          </select>
          <input 
            type="number" 
            v-model.number="newReward.cost.amount"
            min="1"
            class="input-field cost-amount"
          >
        </div>
        <div class="button-group">
          <button 
            v-if="!editingReward" 
            @click="addReward" 
            class="add-btn"
          >
            添加奖励
          </button>
          <template v-else>
            <button @click="saveEdit" class="save-btn">保存</button>
            <button @click="cancelEdit" class="cancel-btn">取消</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 修改奖励列表部分 -->
    <div class="rewards-list">
      <div v-for="(rewards, type) in rewardsByType" 
           :key="type" 
           class="reward-group">
        <div class="group-header" 
             :class="type"
             @click="toggleExpand(type)">
          <div class="header-content">
            <h3>{{ getTypeName(type) }}</h3>
            <span class="reward-stats">
              ({{ rewards.length }})
            </span>
          </div>
          <span class="toggle-icon">{{ expandedTypes[type] ? '▼' : '▶' }}</span>
        </div>
        
        <div class="reward-items" v-show="expandedTypes[type]">
          <div v-if="!rewards.length" class="no-rewards">
            暂无奖励
          </div>
          <div v-else
               v-for="reward in rewards" 
               :key="reward.id" 
               class="reward-item"
               :class="{ 'has-tooltip': reward.description }"
               :data-tooltip="reward.description">
            <div class="reward-content">
              <span class="reward-title">{{ reward.title }}</span>
            </div>
            <div class="reward-actions">
              <span class="cost-amount">{{ reward.cost.amount }}个</span>
              <button @click="startEdit(reward)" class="edit-btn">编辑</button>
              <button @click="deleteReward(reward.id)" class="delete-btn">删除</button>
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
  max-width: 800px;
  margin: 0 auto;
}

.reward-form {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.cost-group {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.input-field {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.cost-amount {
  width: 100px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.add-btn, .save-btn {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.cancel-btn {
  background: #9e9e9e;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.rewards-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.reward-group {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 15px;
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
  gap: 10px;
}

.header-content h3 {
  font-size: 1.2em;
  margin: 0;
  font-weight: 500;
}

.reward-stats {
  color: #666;
  font-size: 1em;
}

.reward-items {
  border-top: 1px solid #eee;
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

.reward-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cost-amount {
  color: #666;
  font-size: 0.95em;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
  color: white;
}

.edit-btn {
  background: #2196F3;
}

.delete-btn {
  background: #f44336;
}

.edit-btn:hover, .delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
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

@media (max-width: 768px) {
  .reward-item {
    padding: 10px 15px;
  }
  
  .reward-title {
    font-size: 1em;
  }
  
  .reward-actions {
    gap: 8px;
  }
  
  .edit-btn, .delete-btn {
    padding: 4px 8px;
    font-size: 0.85em;
  }
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
</style> 

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../api/client';

// 响应式状态
const rewards = ref([]);
const message = ref('');
const editingReward = ref(null);
const newReward = ref({
  title: '',
  description: '',
  cost: {
    type: 'bronze',
    amount: 1
  }
});

// 添加折叠状态管理
const expandedTypes = ref({
  bronze: true,
  silver: true,
  gold: true,
  diamond: true
});

// 按类型分组的奖励
const rewardsByType = computed(() => {
  const result = {
    diamond: [],
    gold: [],
    silver: [],
    bronze: []
  };
  
  rewards.value.forEach(reward => {
    if (result[reward.cost.type]) {
      result[reward.cost.type].push(reward);
    }
  });
  
  return result;
});

// 获取类型名称
function getTypeName(type) {
  const names = {
    diamond: '钻石卡皮巴拉',
    gold: '黄金卡皮巴拉',
    silver: '白银卡皮巴拉',
    bronze: '青铜卡皮巴拉'
  };
  return names[type] || type;
}

// 切换折叠状态
function toggleExpand(type) {
  expandedTypes.value[type] = !expandedTypes.value[type];
}

// 加载奖励列表
async function loadRewards() {
  try {
    const data = await api.getRewards();
    rewards.value = data;
  } catch (error) {
    console.error('Failed to load rewards:', error);
    showMessage('加载奖励失败');
  }
}

// 添加奖励
async function addReward() {
  if (!newReward.value.title) {
    showMessage('请填写奖励标题');
    return;
  }

  try {
    await api.createReward(newReward.value);
    await loadRewards();
    resetForm();
    showMessage('奖励添加成功');
  } catch (error) {
    console.error('Failed to add reward:', error);
    showMessage('添加奖励失败');
  }
}

// 开始编辑
function startEdit(reward) {
  editingReward.value = reward.id;
  newReward.value = {
    ...reward,
    cost: { ...reward.cost }
  };
}

// 保存编辑
async function saveEdit() {
  try {
    await api.updateReward(editingReward.value, newReward.value);
    await loadRewards();
    cancelEdit();
    showMessage('奖励更新成功');
  } catch (error) {
    console.error('Failed to update reward:', error);
    showMessage('更新奖励失败');
  }
}

// 取消编辑
function cancelEdit() {
  editingReward.value = null;
  resetForm();
}

// 删除奖励
async function deleteReward(rewardId) {
  try {
    await api.deleteReward(rewardId);
    await loadRewards();
    showMessage('奖励删除成功');
  } catch (error) {
    console.error('Failed to delete reward:', error);
    showMessage('删除奖励失败');
  }
}

// 重置表单
function resetForm() {
  newReward.value = {
    title: '',
    description: '',
    cost: {
      type: 'bronze',
      amount: 1
    }
  };
}

// 显示消息
function showMessage(text) {
  message.value = text;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

// 组件挂载时加载数据
onMounted(() => {
  loadRewards();
});
</script> 