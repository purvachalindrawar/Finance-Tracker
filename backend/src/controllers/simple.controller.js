import { prisma } from '../utils/prisma.js';

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user });
}

export async function settingsGet(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ currency: user?.currency, locale: user?.locale, timezone: user?.timezone });
}

export async function settingsUpdate(req, res) {
  const { currency, locale, timezone } = req.body || {};
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { currency, locale, timezone } });
  res.json({ user });
}
