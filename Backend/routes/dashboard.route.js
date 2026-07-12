// routes/dashboard.route.js
import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);

export default router;