// routes/assets.route.js
import express from 'express';
import {
    listAssets,
    getAssetSummary,
    listAssetCategories,
    listAssetDepartments,
    createAsset,
    createAssetCategory,
    createDepartment,
    updateDepartmentStatus,
} from '../controllers/assets.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const canManageOrg = requireRole(['ADMIN', 'ASSET_MANAGER']);

router.get('/', authenticateToken, listAssets);
router.get('/summary', authenticateToken, getAssetSummary);
router.get('/categories', authenticateToken, listAssetCategories);
router.post('/categories', authenticateToken, canManageOrg, createAssetCategory);
router.get('/departments', authenticateToken, listAssetDepartments);
router.post('/departments', authenticateToken, canManageOrg, createDepartment);
router.patch('/departments/:id/status', authenticateToken, canManageOrg, updateDepartmentStatus);
router.post('/', authenticateToken, canManageOrg, createAsset);

export default router;
