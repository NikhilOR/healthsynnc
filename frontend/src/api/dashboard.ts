import api from './client';

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
};
