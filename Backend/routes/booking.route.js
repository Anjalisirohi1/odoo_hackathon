// routes/booking.routes.js
import express from 'express';
import {
    getBookableResources,
    getBookingsByDate,
    createBooking
} from '../controllers/booking.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/resources', authenticateToken, getBookableResources);
router.get('/', authenticateToken, getBookingsByDate);
router.post('/', authenticateToken, createBooking);

export default router;