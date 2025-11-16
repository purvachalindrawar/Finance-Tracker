import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

const schema = z.object({ categoryId: z.string(), periodType: z.enum(['monthly','weekly']), limitAmount: z.string().or(z.number()) });

export async function list(req, res) {
  const data = await prisma.budget.findMany({ where: { userId: req.user.id }, include: { category: true } });
  res.json(data);
}

export async function create(req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const b = await prisma.budget.create({ data: { ...parsed.data, userId: req.user.id, limitAmount: parsed.data.limitAmount } });
  res.json(b);
}

export async function update(req, res) {
  const id = req.params.id;
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const b = await prisma.budget.update({ where: { id }, data: parsed.data });
  res.json(b);
}

export async function remove(req, res) {
  const id = req.params.id;
  await prisma.budget.delete({ where: { id } });
  res.json({ ok: true });
}

export async function summary(req, res) {
  const userId = req.user.id;
  const budgets = await prisma.budget.findMany({ where: { userId }, include: { category: true } });
  res.json({ budgets });
}
