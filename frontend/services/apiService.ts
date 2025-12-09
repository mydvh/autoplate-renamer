const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, updates: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(updates: { username?: string; phoneNumber?: string; inputFolderPath?: string; outputFolderPath?: string }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Logs
  async createLog(userId: string, username: string, originalName: string, newName: string) {
    return this.request('/logs', {
      method: 'POST',
      body: JSON.stringify({ userId, username, originalName, newName }),
    });
  }

  async getLogs(filter?: { from?: number; to?: number; userId?: string }) {
    const params = new URLSearchParams();
    if (filter?.from) params.append('from', String(filter.from));
    if (filter?.to) params.append('to', String(filter.to));
    if (filter?.userId) params.append('userId', filter.userId);
    
    const query = params.toString();
    return this.request(`/logs${query ? `?${query}` : ''}`);
  }

  // Config
  async getConfig() {
    return this.request('/config');
  }

  async updateConfig(config: any) {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Analysis
  async analyzeImage(base64Data: string, mimeType: string) {
    return this.request('/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ base64Data, mimeType }),
    });
  }
}

export const apiService = new ApiService();
