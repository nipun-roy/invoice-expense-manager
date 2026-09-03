import { Router } from 'express';
import {
  create,
  list,
  getOne,
  update,
  remove,
  duplicate,
  markPaid,
  downloadPdf,
} from '../controllers/invoice.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from '../validators/invoice.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createInvoiceSchema), create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', validate(updateInvoiceSchema), update);
router.delete('/:id', remove);
router.post('/:id/duplicate', duplicate);
router.patch('/:id/mark-paid', markPaid);
router.get('/:id/pdf', downloadPdf);

export default router;

