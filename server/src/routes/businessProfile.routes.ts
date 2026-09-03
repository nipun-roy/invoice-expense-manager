import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/businessProfile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateBusinessProfileSchema } from '../validators/businessProfile.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', validate(updateBusinessProfileSchema), updateProfile);

export default router;

