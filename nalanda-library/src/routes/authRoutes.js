import express from 'express';
import { getMe, login, register } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
    loginValidation,
    registerValidation,
    validate
} from '../utils/validators.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.get('/me', protect, getMe);

export default router;