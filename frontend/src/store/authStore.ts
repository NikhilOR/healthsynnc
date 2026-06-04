import { create } from 'zustand';
import { authApi, RegisterData, LoginData } from '../api/auth';
import { getItem } from '../utils/storage';

interface User {
  email: string;
  name: string;
  goals?: any;
  settings?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(data);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register(data);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await getItem('auth_token');
      if (token) {
        const userStr = await getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          set({ user, isAuthenticated: true });
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  },

  updateProfile: async (data: any) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.updateProfile(data);
      set({ user: response, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Update failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
