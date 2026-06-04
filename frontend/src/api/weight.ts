import api from './client';

export interface WeightLogCreate {
  weight_kg: number;
  body_fat_percent?: number;
  notes?: string;
}

export const weightApi = {
  logWeight: async (data: WeightLogCreate) => {
    const response = await api.post('/weight/logs', data);
    return response.data;
  },

  getWeightLogs: async (limit: number = 30) => {
    const response = await api.get('/weight/logs', { params: { limit } });
    return response.data;
  },

  getProgress: async () => {
    const response = await api.get('/weight/progress');
    return response.data;
  },
};
