import { prisma } from './utils/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'demo@example.com';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name: 'Demo User' },
    update: {}
  });

  const accountId = user.id + '-acc';
  const account = await prisma.account.upsert({
    where: { id: accountId },
    create: { id: accountId, userId: user.id, name: 'Checking', type: 'checking', currency: 'USD', balance: 1000 },
    update: {}
  });

  const groceries = await prisma.category.upsert({
    where: { id: user.id + '-groceries' },
    create: { id: user.id + '-groceries', userId: user.id, name: 'Groceries' },
    update: {}
  });

  await prisma.transaction.createMany({ data: [
    { userId: user.id, accountId: account.id, amount: -35.5, currency: 'USD', date: new Date(), merchant: 'Store A', categoryId: groceries.id, tags: ['food'] },
    { userId: user.id, accountId: account.id, amount: -12.99, currency: 'USD', date: new Date(), merchant: 'Cafe', tags: ['coffee'] },
    { userId: user.id, accountId: account.id, amount: 2000, currency: 'USD', date: new Date(), merchant: 'Salary' }
  ] });

  await prisma.recurringRule.create({ data: { userId: user.id, accountId: account.id, cronExpression: '0 0 * * *', nextRun: new Date() } });

  console.log('Seed completed. Demo user:', email, 'password:', password);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
