import api from './api';

export async function fetchBudgets() {
  const res = await api.get('/api/budgets');
  return res.data;
}

export async function fetchBudgetSummary() {
  const res = await api.get('/api/budgets/summary');
  return res.data;
}

export async function createBudget(payload) {
  const res = await api.post('/api/budgets', payload);
  return res.data;
}
