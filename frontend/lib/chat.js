import api from './api';

export async function fetchRooms() {
  const res = await api.get('/api/chat/rooms');
  return res.data;
}

export async function createRoom(name) {
  const res = await api.post('/api/chat/rooms', { name });
  return res.data;
}

export async function fetchMessages(roomId) {
  const res = await api.get(`/api/chat/rooms/${roomId}/messages`);
  return res.data;
}

export async function sendMessage(roomId, message) {
  const res = await api.post(`/api/chat/rooms/${roomId}/messages`, { message });
  return res.data;
}
