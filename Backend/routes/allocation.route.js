import express from 'express';
import { createAllocation } from '../controllers/allocation.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole(['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD']), createAllocation);

export default router;
