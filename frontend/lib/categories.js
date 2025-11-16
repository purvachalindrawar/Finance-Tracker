import api from './api';

export async function fetchCategories() {
  const res = await api.get('/api/categories');
  return res.data;
}

export async function createCategory(payload) {
  const res = await api.post('/api/categories', payload);
  return res.data;
}
