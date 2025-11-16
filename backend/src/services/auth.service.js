import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

export async function signup(email, password, name) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error('Email already used');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  return user;
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refresh = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { user, token, refresh };
}
