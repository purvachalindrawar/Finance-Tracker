import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

const roomSchema = z.object({ name: z.string().min(1) });
const msgSchema = z.object({ message: z.string().min(1) });

export async function roomsList(_req, res) {
  // Disable global room listing for privacy
  return res.status(403).json({ error: 'Room listing is disabled' });
}

export async function roomsCreate(req, res) {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const room = await prisma.chatRoom.create({ data: { name: parsed.data.name } });
  res.json(room);
}

export async function messagesList(req, res) {
  const roomId = req.params.id;
  const messages = await prisma.chatMessage.findMany({ where: { roomId }, orderBy: { createdAt: 'asc' } });
  res.json(messages);
}

export async function messagesCreate(req, res) {
  const roomId = req.params.id;
  const parsed = msgSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const msg = await prisma.chatMessage.create({ data: { roomId, senderId: req.user.id, message: parsed.data.message } });
  res.json(msg);
}
