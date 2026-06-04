import api from './client';

export interface CigaretteLogCreate {
  brand?: string;
  cost_per_cigarette?: number;
  notes?: string;
}

export const smokingApi = {
  logCigarette: async (data: CigaretteLogCreate) => {
    const response = await api.post('/smoking/logs', data);
    return response.data;
  },

  getCigaretteLogs: async (date?: string) => {
    const response = await api.get('/smoking/logs', { params: { date } });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/smoking/statistics');
    return response.data;
  },

  getQuitProgress: async () => {
    const response = await api.get('/smoking/quit-progress');
    return response.data;
  },
};
