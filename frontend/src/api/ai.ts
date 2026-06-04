import api from './client';

export const aiApi = {
  chat: async (message: string, context?: any) => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  },

  getWeeklyReport: async () => {
    const response = await api.get('/ai/weekly-report');
    return response.data;
  },
};
