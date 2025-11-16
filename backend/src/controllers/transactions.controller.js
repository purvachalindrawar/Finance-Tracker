import { prisma } from '../utils/prisma.js';
import { z } from 'zod';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse';

export async function list(req, res) {
  const q = req.query?.q || undefined;
  const take = Number(req.query?.take || 20);
  const skip = Number(req.query?.skip || 0);
  const userId = req.user.id;
  const dateFrom = req.query?.dateFrom ? new Date(req.query.dateFrom) : undefined;
  const dateTo = req.query?.dateTo ? new Date(req.query.dateTo) : undefined;
  const dateFilter = (dateFrom || dateTo) ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {};
  const textFilter = q ? { OR: [{ merchant: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } }] } : {};
  const where = { userId, ...dateFilter, ...textFilter };
  const data = await prisma.transaction.findMany({ where, take, skip, orderBy: { date: 'desc' } });
  const total = await prisma.transaction.count({ where });
  res.json({ data, total });
}

const txSchema = z.object({
  accountId: z.string(),
  amount: z.string().or(z.number()),
  currency: z.string().default('USD'),
  date: z.coerce.date(),
  merchant: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function create(req, res) {
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const userId = req.user.id;
  const t = await prisma.transaction.create({ data: { ...parsed.data, userId, amount: parsed.data.amount } });
  res.json(t);
}

export async function get(req, res) {
  const id = req.params.id;
  const userId = req.user.id;
  const t = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
}

export async function update(req, res) {
  const id = req.params.id;
  const userId = req.user.id;
  const parsed = txSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const t = await prisma.transaction.update({ where: { id }, data: { ...parsed.data } });
  await prisma.auditLog.create({ data: { userId, action: 'transaction.update', metadataJson: { id, changes: parsed.data } } });
  res.json(t);
}

export async function remove(req, res) {
  const id = req.params.id;
  const userId = req.user.id;
  await prisma.transaction.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId, action: 'transaction.delete', metadataJson: { id } } });
  res.json({ ok: true });
}

export async function exportCsv(req, res) {
  const userId = req.user.id;
  const rows = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  const stringifier = stringify({ header: true, columns: ['id','date','merchant','amount','currency','categoryId','notes'] });
  stringifier.pipe(res);
  for (const r of rows) stringifier.write([r.id, r.date.toISOString(), r.merchant || '', r.amount.toString(), r.currency, r.categoryId || '', r.notes || '']);
  stringifier.end();
}

export async function importCsv(req, res) {
  const userId = req.user.id;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Missing file' });
  parse(file.buffer, { columns: true, trim: true }, async (err, parsed) => {
    if (err) return res.status(400).json({ error: err.message });
    for (const row of parsed) {
      await prisma.transaction.create({ data: {
        userId,
        accountId: row.accountId,
        amount: row.amount,
        currency: row.currency || 'USD',
        date: new Date(row.date),
        merchant: row.merchant || null,
        categoryId: row.categoryId || null,
        notes: row.notes || null,
        tags: row.tags ? String(row.tags).split('|') : [],
      } });
    }
    res.json({ imported: parsed.length });
  });
}
