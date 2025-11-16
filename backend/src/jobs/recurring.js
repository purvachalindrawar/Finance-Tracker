import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';

export function startRecurringJob() {
  cron.schedule('*/10 * * * *', async () => {
    const now = new Date();
    const rules = await prisma.recurringRule.findMany({ where: { nextRun: { lte: now } } });
    for (const r of rules) {
      const amount = 100; // stub
      await prisma.transaction.create({ data: { userId: r.userId, accountId: r.accountId, amount, currency: 'USD', date: now, merchant: 'Recurring' } });
      await prisma.recurringRule.update({ where: { id: r.id }, data: { nextRun: new Date(now.getTime() + 24*60*60*1000) } });
    }
  });
}
