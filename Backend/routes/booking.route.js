// routes/booking.routes.js
import express from 'express';
import {
    getBookableResources,
    getBookingsByDate,
    listMyBookings,
    createBooking,
    cancelBooking,
    rescheduleBooking
} from '../controllers/booking.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/resources', authenticateToken, getBookableResources);
router.get('/mine', authenticateToken, listMyBookings);
router.get('/', authenticateToken, getBookingsByDate);
router.post('/', authenticateToken, createBooking);
router.patch('/:id/cancel', authenticateToken, cancelBooking);
router.patch('/:id', authenticateToken, rescheduleBooking);

export default router;
