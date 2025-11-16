import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

const schema = z.object({ accountId: z.string(), cronExpression: z.string().optional(), ruleJson: z.any().optional(), nextRun: z.coerce.date().optional() });

export async function list(req, res) {
  const rules = await prisma.recurringRule.findMany({ where: { userId: req.user.id } });
  res.json(rules);
}

export async function create(req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const r = await prisma.recurringRule.create({ data: { ...parsed.data, userId: req.user.id } });
  res.json(r);
}

export async function update(req, res) {
  const id = req.params.id;
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const r = await prisma.recurringRule.update({ where: { id }, data: parsed.data });
  res.json(r);
}

export async function remove(req, res) {
  const id = req.params.id;
  await prisma.recurringRule.delete({ where: { id } });
  res.json({ ok: true });
}
