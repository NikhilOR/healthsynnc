import api from './client';
import { storage } from '../../src/utils/storage';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    if (response.data.access_token) {
      await storage.setItem('auth_token', response.data.access_token);
      await storage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    if (response.data.access_token) {
      await storage.setItem('auth_token', response.data.access_token);
      await storage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await storage.removeItem('auth_token');
    await storage.removeItem('user');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data);
    await storage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },
};
