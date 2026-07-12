// routes/auth.routes.js
import express from 'express';
import { signup, login, forgotPassword, getMe, promoteUser, listUsers } from '../controllers/auth.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authenticateToken, getMe);

// Admin-only routes
router.get('/users', authenticateToken, requireRole(['ADMIN']), listUsers);
router.patch('/users/:id/promote', authenticateToken, requireRole(['ADMIN']), promoteUser);

export default router;
