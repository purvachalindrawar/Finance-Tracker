import api from './api';

export async function getSettings() {
  const res = await api.get('/api/users/settings');
  return res.data;
}

export async function updateSettings(payload) {
  const res = await api.put('/api/users/settings', payload);
  return res.data;
}
