import { prisma } from '../utils/prisma.js';

export function requireRole(role) {
  return async function(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean);
      const isAdmin = admins.includes(user.email);
      if (role === 'admin' && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (e) {
      next(e);
    }
  }
}
