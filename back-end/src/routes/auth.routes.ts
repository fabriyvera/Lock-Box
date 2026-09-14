import { Router } from 'express';
import { loginController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', validate(loginSchema), loginController);

export default router;