import api from './client';

export const chartsApi = {
  foodWeekly: async () => (await api.get('/charts/food-weekly')).data,
  waterWeekly: async () => (await api.get('/charts/water-weekly')).data,
  weightHistory: async () => (await api.get('/charts/weight-history')).data,
  expensesWeekly: async () => (await api.get('/charts/expenses-weekly')).data,
};
