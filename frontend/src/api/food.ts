import api from './client';

export interface FoodItemCreate {
  name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  category?: string;
}

export interface FoodLogCreate {
  food_item_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity?: number;
  notes?: string;
  image?: string;
}

export const foodApi = {
  searchFoodItems: async (query: string) => {
    const response = await api.get('/food/items', { params: { q: query } });
    return response.data;
  },

  createFoodItem: async (data: FoodItemCreate) => {
    const response = await api.post('/food/items', data);
    return response.data;
  },

  createFoodLog: async (data: FoodLogCreate) => {
    const response = await api.post('/food/logs', data);
    return response.data;
  },

  getFoodLogs: async (date?: string) => {
    const response = await api.get('/food/logs', { params: { date } });
    return response.data;
  },

  deleteFoodLog: async (logId: string) => {
    const response = await api.delete(`/food/logs/${logId}`);
    return response.data;
  },

  analyzeImage: async (imageBase64: string) => {
    const response = await api.post('/food/analyze-image', { image: imageBase64 });
    return response.data;
  },
};
