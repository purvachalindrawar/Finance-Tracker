import api from './api';

export async function fetchTransactions({ q, dateFrom, dateTo, skip = 0, take = 20 }) {
  const res = await api.get('/api/transactions', { params: { q, dateFrom, dateTo, skip, take } });
  return res.data;
}

export async function createTransaction(payload) {
  const res = await api.post('/api/transactions', payload);
  return res.data;
}

export async function exportCsv() {
  const res = await api.get('/api/transactions/export', { responseType: 'blob' });
  return res.data; // blob
}

export async function importCsv(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/api/transactions/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}
