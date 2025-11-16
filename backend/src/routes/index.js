import { Router } from 'express';
import * as Auth from '../controllers/auth.controller.js';
import * as Tx from '../controllers/transactions.controller.js';
import * as Simple from '../controllers/simple.controller.js';
import * as Files from '../controllers/files.controller.js';
import * as An from '../controllers/analytics.controller.js';
import * as Accounts from '../controllers/accounts.controller.js';
import * as Categories from '../controllers/categories.controller.js';
import * as Budgets from '../controllers/budgets.controller.js';
import * as Recurring from '../controllers/recurring.controller.js';
import * as Chat from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';

const upload = multer();

export const router = Router();

router.post('/api/auth/signup', Auth.signup);
router.post('/api/auth/login', Auth.login);
router.post('/api/auth/refresh', Auth.refresh);
router.get('/api/auth/me', requireAuth, Simple.me);

router.get('/api/users/me', requireAuth, Simple.me);
router.get('/api/users/settings', requireAuth, Simple.settingsGet);
router.put('/api/users/settings', requireAuth, Simple.settingsUpdate);

router.get('/api/transactions', requireAuth, Tx.list);
router.post('/api/transactions', requireAuth, Tx.create);
router.get('/api/transactions/export', requireAuth, Tx.exportCsv);
router.post('/api/transactions/import', requireAuth, upload.single('file'), Tx.importCsv);
router.get('/api/transactions/:id', requireAuth, Tx.get);
router.put('/api/transactions/:id', requireAuth, Tx.update);
router.delete('/api/transactions/:id', requireAuth, Tx.remove);

router.post('/api/attachments', requireAuth, upload.single('file'), Files.upload);
router.post('/api/ocr/receipt', requireAuth, Files.ocrReceipt);

router.post('/api/recommendations/generate', requireAuth, An.recommendationsGenerate);
router.get('/api/recommendations', requireAuth, An.recommendationsList);

router.get('/api/analytics/forecast', requireAuth, An.forecast);
router.get('/api/analytics/anomalies', requireAuth, An.anomalies);

router.get('/api/accounts', requireAuth, Accounts.list);
router.post('/api/accounts', requireAuth, Accounts.create);
router.put('/api/accounts/:id', requireAuth, Accounts.update);
router.delete('/api/accounts/:id', requireAuth, Accounts.remove);

router.get('/api/categories', requireAuth, Categories.list);
router.post('/api/categories', requireAuth, Categories.create);
router.put('/api/categories/:id', requireAuth, Categories.update);
router.delete('/api/categories/:id', requireAuth, Categories.remove);

router.get('/api/budgets', requireAuth, Budgets.list);
router.get('/api/budgets/summary', requireAuth, Budgets.summary);
router.post('/api/budgets', requireAuth, Budgets.create);
router.put('/api/budgets/:id', requireAuth, Budgets.update);
router.delete('/api/budgets/:id', requireAuth, Budgets.remove);

router.get('/api/recurring', requireAuth, Recurring.list);
router.post('/api/recurring', requireAuth, Recurring.create);
router.put('/api/recurring/:id', requireAuth, Recurring.update);
router.delete('/api/recurring/:id', requireAuth, Recurring.remove);

router.get('/api/chat/rooms', requireAuth, Chat.roomsList);
router.post('/api/chat/rooms', requireAuth, Chat.roomsCreate);
router.get('/api/chat/rooms/:id/messages', requireAuth, Chat.messagesList);
router.post('/api/chat/rooms/:id/messages', requireAuth, Chat.messagesCreate);
