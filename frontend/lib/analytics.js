import api from './api';

export async function fetchForecast() {
  const res = await api.get('/api/analytics/forecast');
  return res.data;
}

export async function fetchAnomalies() {
  const res = await api.get('/api/analytics/anomalies');
  return res.data;
}

export async function fetchRecommendations() {
  const res = await api.get('/api/recommendations');
  return res.data;
}

export async function generateRecommendations() {
  const res = await api.post('/api/recommendations/generate');
  return res.data;
}
