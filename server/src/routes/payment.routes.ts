import { Router } from 'express';
import { create, list, getOne } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPaymentSchema } from '../validators/payment.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createPaymentSchema), create);
router.get('/', list);
router.get('/:id', getOne);

export default router;

