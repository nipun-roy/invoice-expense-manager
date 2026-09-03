import { Router } from 'express';
import {
  create,
  list,
  getOne,
  update,
  remove,
} from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from '../validators/expense.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createExpenseSchema), create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', validate(updateExpenseSchema), update);
router.delete('/:id', remove);

export default router;

