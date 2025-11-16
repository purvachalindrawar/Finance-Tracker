import { prisma } from '../utils/prisma.js';

// Return last 14 days of daily totals and a simple 7-day projection using the
// average of the last 7 days. Positive amounts are income, negatives are spend.
export async function forecast(req, res) {
  const userId = req.user.id;
  const since = new Date();
  since.setDate(since.getDate() - 21);
  const tx = await prisma.transaction.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  // Group by YYYY-MM-DD
  const byDay = new Map();
  for (const t of tx) {
    const d = t.date.toISOString().slice(0, 10);
    const prev = byDay.get(d) || 0;
    byDay.set(d, prev + Number(t.amount));
  }

  function fmt(d) { return d.toISOString().slice(5, 10); }

  // Build last 14 days series
  const today = new Date();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ x: fmt(d), y: byDay.get(key) || 0 });
  }

  // Average of last 7 actual days
  const last7 = days.slice(-7).map(p => p.y);
  const avg = last7.length ? last7.reduce((a,b)=>a+b,0) / last7.length : 0;

  // Next 7 days projection
  const proj = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    proj.push({ x: fmt(d), y: avg });
  }

  res.json({ forecast: [...days, ...proj] });
}

// Very simple anomaly heuristic:
// - Flags expenses whose absolute amount is greater than mean + 2*std of the last 60 days expenses
// - Flags duplicate-looking same-day, same-merchant, same-amount expenses
export async function anomalies(req, res) {
  const userId = req.user.id;
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const tx = await prisma.transaction.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'desc' },
  });

  // Consider absolute amounts of all non-zero transactions to support UIs
  // where users input expenses as positive values.
  const expenses = tx
    .map(t => Math.abs(Number(t.amount)))
    .filter(v => v > 0);
  const mean = expenses.length ? expenses.reduce((a,b)=>a+b,0) / expenses.length : 0;
  const variance = expenses.length ? expenses.reduce((a,b)=>a + Math.pow(b-mean,2),0) / expenses.length : 0;
  const std = Math.sqrt(variance);
  const thresh = mean + 2*std;

  const anomalies = [];
  const seen = new Set();

  for (const t of tx) {
    const amt = Number(t.amount);
    const absAmt = Math.abs(amt);
    const key = `${t.merchant || '-'}|${absAmt}|${t.date.toISOString().slice(0,10)}`;
    if (absAmt > 0 && absAmt > thresh && thresh > 0) {
      anomalies.push({
        type: 'large-expense',
        amount: absAmt,
        merchant: t.merchant || null,
        date: t.date,
        message: `Unusual spend of ${absAmt.toFixed(2)} ${t.currency} ${t.merchant ? 'at '+t.merchant : ''}`.trim(),
      });
    }
    if (seen.has(key)) {
      anomalies.push({
        type: 'duplicate-looking',
        amount: absAmt,
        merchant: t.merchant || null,
        date: t.date,
        message: `Possible duplicate: ${absAmt.toFixed(2)} ${t.currency} ${t.merchant ? 'at '+t.merchant : ''}`.trim(),
      });
    } else {
      seen.add(key);
    }
  }

  res.json({ anomalies: anomalies.slice(0, 10) });
}

export async function recommendationsGenerate(req, res) {
  const userId = req.user.id;
  const income = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, amount: { gt: 0 } } });
  const expense = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, amount: { lt: 0 } } });
  const tip = {
    type: 'percent-of-income',
    payloadJson: { saveRate: 0.2, income: income._sum.amount?.toString() || '0', expense: expense._sum.amount?.toString() || '0' }
  };
  const rec = await prisma.recommendation.create({ data: { userId, type: tip.type, payloadJson: tip.payloadJson } });
  res.json(rec);
}

export async function recommendationsList(req, res) {
  const recs = await prisma.recommendation.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json(recs);
}
