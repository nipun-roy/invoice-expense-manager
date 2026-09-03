import { Router } from 'express';
import {
  list,
  create,
  update,
  remove,
} from '../controllers/expenseCategory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/expenseCategory.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.post('/', validate(createCategorySchema), create);
router.put('/:id', validate(updateCategorySchema), update);
router.delete('/:id', remove);

export default router;

