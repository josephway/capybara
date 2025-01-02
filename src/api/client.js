class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
        this.token = localStorage.getItem('api_key');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('api_key', token);
        } else {
            localStorage.removeItem('api_key');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // 卡皮巴拉相关
    async getCapybaras() {
        return this.request('capybaras');
    }

    async updateCapybaras(data) {
        return this.request('capybaras', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // 任务相关
    async getTasks() {
        return this.request('tasks');
    }

    async createTask(task) {
        return this.request('tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        });
    }

    async updateTask(id, task) {
        return this.request(`tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(task)
        });
    }

    async deleteTask(id) {
        return this.request(`tasks/${id}`, {
            method: 'DELETE'
        });
    }

    // 奖励相关
    async getRewards() {
        return this.request('rewards');
    }

    async createReward(reward) {
        return this.request('rewards', {
            method: 'POST',
            body: JSON.stringify(reward)
        });
    }

    async updateReward(id, reward) {
        return this.request(`rewards/${id}`, {
            method: 'PUT',
            body: JSON.stringify(reward)
        });
    }

    async deleteReward(id) {
        return this.request(`rewards/${id}`, {
            method: 'DELETE'
        });
    }

    async addReward(reward) {
        return this.request('rewards', {
            method: 'POST',
            body: JSON.stringify(reward)
        });
    }

    // 添加兑换奖励的方法
    async exchangeReward(rewardId) {
        return this.request(`rewards/${rewardId}/exchange`, {
            method: 'POST'
        });
    }

    async getExchangedRewards() {
        return this.request('exchanged-rewards');
    }
}

export const api = new ApiClient(); 