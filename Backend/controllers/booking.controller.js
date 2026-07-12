// controllers/booking.controller.js
import db from '../database/db.js';

// 1. Get all assets marked as shared/bookable
export const getBookableResources = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT id, name, asset_tag, location, is_bookable, status,
             COALESCE(location, 'Conference Center') as location
      FROM assets 
      WHERE is_bookable = TRUE
    `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching bookable resources:', error);
        res.status(500).json({ error: 'Failed to retrieve resources.' });
    }
};

// 2. Fetch all bookings for a single resource on a specific date
export const getBookingsByDate = async (req, res) => {
    const { assetId, date } = req.query; // Expects assetId and date string (YYYY-MM-DD)

    if (!assetId || !date) {
        return res.status(400).json({ error: 'Asset ID and date are required parameters.' });
    }

    try {
        const result = await db.query(`
      SELECT b.id, b.start_time, b.end_time, b.status, u.name as booked_by
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.asset_id = $1 
        AND b.status IN ('UPCOMING', 'ONGOING', 'COMPLETED')
        AND b.start_time::date = $2::date
      ORDER BY b.start_time ASC
    `, [parseInt(assetId), date]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch schedule.' });
    }
};

// 3. Create booking with OVERLAP VALIDATION [1]
export const createBooking = async (req, res) => {
    const { asset_id, start_time, end_time } = req.body; // ISO Strings or Timestamps

    if (!asset_id || !start_time || !end_time) {
        return res.status(400).json({ error: 'Asset, start time, and end time are required.' });
    }

    const requestedStart = new Date(start_time);
    const requestedEnd = new Date(end_time);

    if (requestedStart >= requestedEnd) {
        return res.status(400).json({ error: 'Start time must be strictly before end time.' });
    }

    try {
        // Overlap Check Query: Checks if start < existingEnd AND end > existingStart [1]
        const conflictQuery = await db.query(`
      SELECT b.id, b.start_time, b.end_time, u.name as booked_by
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.asset_id = $1
        AND b.status IN ('UPCOMING', 'ONGOING')
        AND b.start_time < $3
        AND b.end_time > $2
      LIMIT 1
    `, [parseInt(asset_id), requestedStart, requestedEnd]);

        if (conflictQuery.rows.length > 0) {
            const conflict = conflictQuery.rows[0];

            // Formatting time output for the frontend dialog
            const conflictStart = new Date(conflict.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const conflictEnd = new Date(conflict.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return res.status(409).json({
                error: 'Conflict detected',
                conflictDetails: {
                    message: `Slot is unavailable. Overlaps with ${conflict.booked_by || 'Procurement Team'}'s booking (${conflictStart} - ${conflictEnd}).`,
                    booked_by: conflict.booked_by,
                    start: conflict.start_time,
                    end: conflict.end_time
                }
            });
        }

        // Insert booking
        const result = await db.query(
            `INSERT INTO bookings (asset_id, user_id, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, 'UPCOMING'::booking_status)
       RETURNING *`,
            [parseInt(asset_id), req.user.id, requestedStart, requestedEnd]
        );

        res.status(201).json({
            message: 'Booking confirmed successfully.',
            booking: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to record booking.' });
    }
};