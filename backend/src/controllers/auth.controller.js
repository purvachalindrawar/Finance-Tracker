import { z } from 'zod';
import * as Auth from '../services/auth.service.js';
import jwt from 'jsonwebtoken';

const credSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() });

export async function signup(req, res) {
  const parsed = credSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  try {
    const user = await Auth.signup(parsed.data.email, parsed.data.password, parsed.data.name);
    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

export async function login(req, res) {
  const parsed = credSchema.omit({ name: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  try {
    const { user, token, refresh } = await Auth.login(parsed.data.email, parsed.data.password);
    return res.json({ token, refresh, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
}

export async function refresh(req, res) {
  const { refresh } = req.body || {};
  if (!refresh) return res.status(400).json({ error: 'Missing refresh' });
  try {
    const decoded = jwt.verify(refresh, process.env.JWT_SECRET);
    const token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh' });
  }
}
