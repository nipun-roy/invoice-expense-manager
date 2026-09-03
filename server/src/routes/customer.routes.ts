import { Router } from 'express';
import {
  create,
  list,
  getOne,
  update,
  remove,
} from '../controllers/customer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../validators/customer.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCustomerSchema), create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', validate(updateCustomerSchema), update);
router.delete('/:id', remove);

export default router;

