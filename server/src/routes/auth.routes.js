import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  changePassword,
  changePasswordSchema,
  login,
  loginSchema,
  logout,
  me,
  register,
  registerSchema,
} from '../controllers/auth.controller.js';
import {
  getProfile,
  profileSchema,
  updateProfile,
} from '../controllers/profile.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes.' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);
router.patch('/password', authenticate, validate(changePasswordSchema), changePassword);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(profileSchema), updateProfile);

export default router;
