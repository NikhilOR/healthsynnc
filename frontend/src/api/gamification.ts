import api from './client';

export const gamificationApi = {
  getAchievements: async () => {
    const response = await api.get('/gamification/achievements');
    return response.data;
  },

  getStreaks: async () => {
    const response = await api.get('/gamification/streaks');
    return response.data;
  },
};
