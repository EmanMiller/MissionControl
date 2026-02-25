const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** True if the error is due to network/offline or backend unreachable (for PWA graceful degradation). */
export function isNetworkError(error) {
  if (!error) return false;
  if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message?.includes('fetch'))) return true;
  if (error.message === 'Server unreachable') return true;
  return false;
}

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('mission_control_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('mission_control_token', token);
    } else {
      localStorage.removeItem('mission_control_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error(`API request failed: ${config.method || options.method || 'GET'} ${url}`, error);
      if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message?.includes('fetch'))) {
        const networkError = new Error('Server unreachable');
        networkError.cause = error;
        throw networkError;
      }
      throw error;
    }
  }

  // Authentication
  async verifyToken() {
    if (!this.token) return null;
    try {
      return await this.request('/auth/verify', {
        method: 'POST',
        body: { token: this.token }
      });
    } catch (error) {
      this.setToken(null);
      return null;
    }
  }

  async loginWithGoogle(credential) {
    const response = await this.request('/auth/google', {
      method: 'POST',
      body: { credential }
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async loginWithGitHub(code, state) {
    const response = await this.request('/auth/github/callback', {
      method: 'POST',
      body: { code, state }
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async loginWithApple(idToken, user) {
    const response = await this.request('/auth/apple', {
      method: 'POST',
      body: { id_token: idToken, user }
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async loginWithDemo() {
    const response = await this.request('/auth/demo', { method: 'POST' });
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  // Tasks
  async getTasks() {
    return await this.request('/tasks');
  }

  async createTask(taskData) {
    return await this.request('/tasks', {
      method: 'POST',
      body: taskData
    });
  }

  async updateTask(taskId, taskData) {
    return await this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: taskData
    });
  }

  async updateTaskStatus(taskId, status) {
    return await this.request(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: { status }
    });
  }

  async deleteTask(taskId) {
    return await this.request(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }

  async getTaskStats() {
    return await this.request('/tasks/stats/summary');
  }

  // User
  async getProfile() {
    return await this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: profileData
    });
  }

  async getDashboard() {
    return await this.request('/users/dashboard');
  }

  async deleteAccount() {
    return await this.request('/users/account', {
      method: 'DELETE'
    });
  }

  // OpenClaw
  async getOpenClawConfig() {
    return await this.request('/openclaw/config');
  }

  async testOpenClawConnection(endpoint, token) {
    return await this.request('/openclaw/test', {
      method: 'POST',
      body: { endpoint, token }
    });
  }

  async saveOpenClawConfig(endpoint, token) {
    return await this.request('/openclaw/config', {
      method: 'POST',
      body: { endpoint, token }
    });
  }

  async removeOpenClawConfig() {
    return await this.request('/openclaw/config', {
      method: 'DELETE'
    });
  }

  async getOpenClawStatus() {
    return await this.request('/openclaw/status');
  }

  async getWebhookUrl() {
    return await this.request('/openclaw/webhook-url');
  }

  // Agents
  async getAgents() {
    return await this.request('/agents');
  }

  async createAgent(agentData) {
    return await this.request('/agents', {
      method: 'POST',
      body: agentData
    });
  }

  async updateAgentStatus(agentId, status, currentTaskId = null) {
    return await this.request(`/agents/${agentId}/status`, {
      method: 'PUT',
      body: { status, currentTaskId }
    });
  }

  async updateAgentStats(agentId, stats) {
    return await this.request(`/agents/${agentId}/stats`, {
      method: 'PUT',
      body: { stats }
    });
  }

  async deleteAgent(agentId) {
    return await this.request(`/agents/${agentId}`, {
      method: 'DELETE'
    });
  }

  // Analytics
  async getDashboardAnalytics() {
    return await this.request('/analytics/dashboard');
  }

  async getAgentAnalytics(agentId) {
    return await this.request(`/analytics/agents/${agentId}`);
  }

  async updateAgentPerformanceStats(agentId, metrics) {
    return await this.request(`/analytics/agents/${agentId}/update-stats`, {
      method: 'POST',
      body: { metrics }
    });
  }

  // OpenClaw Integration
  async syncOpenClawAgents() {
    return await this.request('/openclaw/sync-agents', {
      method: 'POST'
    });
  }

  // Projects
  async getProjects() {
    return await this.request('/projects');
  }

  async getProject(projectId) {
    return await this.request(`/projects/${projectId}`);
  }

  async createProject(projectData) {
    return await this.request('/projects', {
      method: 'POST',
      body: projectData
    });
  }

  async updateProject(projectId, projectData) {
    return await this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: projectData
    });
  }

  async deleteProject(projectId) {
    return await this.request(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  async getProjectTasks(projectId) {
    return await this.request(`/projects/${projectId}/tasks`);
  }
}

export default new ApiClient();