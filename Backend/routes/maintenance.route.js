import express from 'express'
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
} from '../controllers/maintenance.controller.js'
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/', authenticateToken, getMaintenanceRequests)
router.post('/', authenticateToken, createMaintenanceRequest)
router.patch('/:id', authenticateToken, requireRole(['ADMIN', 'ASSET_MANAGER']), updateMaintenanceRequest)

export default router
