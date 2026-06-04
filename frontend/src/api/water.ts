import api from './client';

export const waterApi = {
  logWater: async (amount_ml: number) => {
    const response = await api.post('/water/logs', { amount_ml });
    return response.data;
  },

  getWaterLogs: async (date?: string) => {
    const response = await api.get('/water/logs', { params: { date } });
    return response.data;
  },

  getDailyProgress: async () => {
    const response = await api.get('/water/daily-progress');
    return response.data;
  },
};
