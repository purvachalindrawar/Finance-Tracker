import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from './auth.js';

export async function audit(action: string, metadata: Record<string, unknown>, req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    if (req.user?.id) {
      await prisma.auditLog.create({ data: { userId: req.user.id, action, metadataJson: metadata } });
    }
  } catch {}
  next();
}
