import { Router } from 'express';
import {
  income,
  expenses,
  profit,
  invoices,
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/income', income);
router.get('/expenses', expenses);
router.get('/profit', profit);
router.get('/invoices', invoices);

export default router;

