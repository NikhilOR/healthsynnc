import api from './client';

export interface ExpenseLogCreate {
  item_name: string;
  amount: number;
  category: 'food' | 'groceries' | 'fruits' | 'vegetables' | 'supplements' | 'restaurant' | 'drinks' | 'smoking' | 'other';
  notes?: string;
}

export const expensesApi = {
  logExpense: async (data: ExpenseLogCreate) => {
    const response = await api.post('/expenses/logs', data);
    return response.data;
  },

  getExpenseLogs: async (date?: string, period: string = 'daily') => {
    const response = await api.get('/expenses/logs', { params: { date, period } });
    return response.data;
  },

  getSummary: async (period: string = 'monthly') => {
    const response = await api.get('/expenses/summary', { params: { period } });
    return response.data;
  },
};
