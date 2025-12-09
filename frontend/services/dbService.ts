import { User, UserRole, ProcessingLog, SystemConfig } from "../types";
import { apiService } from "./apiService";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dbService = {
  
  // --- INIT ---
  async initDatabase() {
    // No need to initialize - backend handles migrations
    console.log("Connected to backend API");
  },

  // --- USER AUTH ---
  async login(email: string, password: string): Promise<User> {
    await delay(300);
    const user = await apiService.login(email, password);
    return user;
  },

  // --- USER CRUD (Admin Only) ---
  async getUsers(): Promise<User[]> {
    await delay(300);
    return apiService.getUsers();
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await delay(400);
    return apiService.createUser(userData);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await delay(300);
    await apiService.updateUser(id, updates);
  },

  async deleteUser(id: string): Promise<void> {
    await delay(300);
    await apiService.deleteUser(id);
  },

  async getUserProfile(): Promise<User> {
    await delay(200);
    return apiService.getUserProfile();
  },

  async updateUserProfile(updates: { username?: string; phoneNumber?: string; inputFolderPath?: string; outputFolderPath?: string }): Promise<void> {
    await delay(300);
    await apiService.updateUserProfile(updates);
  },

  // --- LOGGING ---
  async createLog(userId: string, username: string, originalName: string, newName: string): Promise<void> {
    await apiService.createLog(userId, username, originalName, newName);
  },

  async getLogs(filter?: { from?: number, to?: number, userId?: string }): Promise<ProcessingLog[]> {
    await delay(300);
    return apiService.getLogs(filter);
  },

  // --- SYSTEM CONFIG ---
  async getConfig(): Promise<SystemConfig> {
    await delay(200);
    return apiService.getConfig();
  },

  async updateConfig(config: SystemConfig): Promise<void> {
    await delay(300);
    await apiService.updateConfig(config);
  }
};