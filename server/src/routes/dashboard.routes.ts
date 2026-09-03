import { Router } from 'express';
import { getMetrics } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMetrics);

export default router;

