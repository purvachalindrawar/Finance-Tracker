import { prisma } from '../utils/prisma.js';
import Tesseract from 'tesseract.js';

export async function upload(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Missing file' });
  const a = await prisma.attachment.create({ data: { ownerId: req.user.id, filename: file.originalname, contentType: file.mimetype, data: file.buffer } });
  res.json({ id: a.id });
}

export async function ocrReceipt(req, res) {
  const { attachmentId } = req.body || {};
  const att = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!att) return res.status(404).json({ error: 'Not found' });
  try {
    const { data } = await Tesseract.recognize(Buffer.from(att.data), 'eng');
    await prisma.attachment.update({ where: { id: att.id }, data: { ocrJson: { text: data.text } } });
    res.json({ text: data.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
