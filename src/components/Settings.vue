<template>
  <div class="settings">
    <div class="settings-form">
      <div class="form-group">
        <label for="apiKey">API Key</label>
        <input 
          type="password" 
          id="apiKey" 
          v-model="apiKey" 
          placeholder="输入你的 API Key"
        >
      </div>
      <button @click="testApiKey">验证并保存</button>
    </div>
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client';

const apiKey = ref('');
const message = ref('');

onMounted(() => {
  const savedKey = localStorage.getItem('api_key');
  if (savedKey) {
    apiKey.value = savedKey;
  }
});

async function testApiKey() {
  if (!apiKey.value.trim()) {
    message.value = '请输入 API Key';
    return;
  }

  try {
    // 先保存 API Key
    api.setToken(apiKey.value);
    
    // 测试 API 连接
    const response = await api.request('test');
    console.log('Test response:', response); // 添加调试信息
    
    if (response.message === 'API Key 验证成功') {
      message.value = 'API Key 验证成功';
      localStorage.setItem('api_key', apiKey.value);
      
      // 延迟刷新页面，让用户看到成功消息
      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      throw new Error('验证失败');
    }
  } catch (error) {
    console.error('API key test failed:', error);
    message.value = 'API Key 无效';
    localStorage.removeItem('api_key');
    api.setToken(null);
  }
}
</script>

<style scoped>
.settings {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.settings-form {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;
}

button:hover {
  background: #45a049;
}

.message {
  margin-top: 16px;
  padding: 10px;
  border-radius: 6px;
  background: #e3f2fd;
  color: #1976d2;
  text-align: center;
}
</style> 