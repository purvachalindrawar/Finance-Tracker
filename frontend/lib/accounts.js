import api from './api';

export async function fetchAccounts() {
  const res = await api.get('/api/accounts');
  return res.data;
}

export async function createAccount(payload) {
  const res = await api.post('/api/accounts', payload);
  return res.data;
}
