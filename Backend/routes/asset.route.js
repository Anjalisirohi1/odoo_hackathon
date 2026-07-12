// routes/asset.routes.js
import express from 'express';
import { registerAsset } from '../controllers/asset.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route restricted to Admins and Asset Managers [1]
router.post('/', authenticateToken, requireRole(['ADMIN', 'ASSET_MANAGER']), registerAsset);

export default router;