import { Router } from 'express';
import {
  create,
  list,
  getOne,
  update,
  remove,
} from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProductSchema), create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', validate(updateProductSchema), update);
router.delete('/:id', remove);

export default router;

