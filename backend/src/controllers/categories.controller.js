import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

const schema = z.object({ name: z.string(), parentId: z.string().optional() });

export async function list(req, res) {
  const data = await prisma.category.findMany({ where: { userId: req.user.id } });
  res.json(data);
}

export async function create(req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const c = await prisma.category.create({ data: { ...parsed.data, userId: req.user.id } });
  res.json(c);
}

export async function update(req, res) {
  const id = req.params.id;
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const c = await prisma.category.update({ where: { id }, data: parsed.data });
  res.json(c);
}

export async function remove(req, res) {
  const id = req.params.id;
  await prisma.category.delete({ where: { id } });
  res.json({ ok: true });
}
