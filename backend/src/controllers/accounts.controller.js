import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

const schema = z.object({ name: z.string(), type: z.string(), currency: z.string().default('USD'), balance: z.string().or(z.number()).default('0') });

export async function list(req, res) {
  const data = await prisma.account.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json(data);
}

export async function create(req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const a = await prisma.account.create({ data: { ...parsed.data, userId: req.user.id, balance: parsed.data.balance } });
  res.json(a);
}

export async function update(req, res) {
  const id = req.params.id;
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const a = await prisma.account.update({ where: { id }, data: { ...parsed.data } });
  res.json(a);
}

export async function remove(req, res) {
  const id = req.params.id;
  await prisma.account.delete({ where: { id } });
  res.json({ ok: true });
}
