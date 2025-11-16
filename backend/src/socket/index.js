import { Server } from 'socket.io';
import { prisma } from '../utils/prisma.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join', (roomId) => {
      socket.join(roomId);
      const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      io.to(roomId).emit('chat:presence', { roomId, count });
    });

    socket.on('chat:message', async (payload) => {
      const msg = await prisma.chatMessage.create({ data: { roomId: payload.roomId, senderId: payload.senderId, message: payload.message } });
      io.to(payload.roomId).emit('chat:message', msg);
    });

    socket.on('chat:typing', (payload) => {
      // Notify others in the room
      socket.to(payload.roomId).emit('chat:typing', { roomId: payload.roomId, userId: payload.userId });
    });

    socket.on('leave', (roomId) => {
      socket.leave(roomId);
      const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      io.to(roomId).emit('chat:presence', { roomId, count });
    });
  });

  return io;
}
