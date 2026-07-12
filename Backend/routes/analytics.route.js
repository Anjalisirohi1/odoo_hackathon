import express from 'express';
import {
    getScreen9Analytics,
    getIdleAssets,
    getRetirementCandidates,
    getBookingHeatmap,
    getDepartmentUtilization,
} from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/screen9', authenticateToken, getScreen9Analytics);
router.get('/screen9/idle-assets', authenticateToken, getIdleAssets);
router.get('/screen9/retirement-candidates', authenticateToken, getRetirementCandidates);
router.get('/screen9/booking-heatmap', authenticateToken, getBookingHeatmap);
router.get('/screen9/department-utilization', authenticateToken, getDepartmentUtilization);

export default router;
