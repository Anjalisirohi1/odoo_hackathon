// routes/assets.route.js
import express from 'express';
import {
    listAssets,
    getAssetSummary,
    listAssetCategories,
    listAssetDepartments,
    createAsset,
} from '../controllers/assets.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, listAssets);
router.get('/summary', authenticateToken, getAssetSummary);
router.get('/categories', authenticateToken, listAssetCategories);
router.get('/departments', authenticateToken, listAssetDepartments);
router.post('/', authenticateToken, requireRole(['ADMIN', 'ASSET_MANAGER']), createAsset);

export default router;
