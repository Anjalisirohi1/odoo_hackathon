import express from 'express'
import { getTransferDetails, createTransferRequest } from '../controllers/transfer.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/:assetId', authenticateToken, getTransferDetails)
router.post('/', authenticateToken, createTransferRequest)

export default router
