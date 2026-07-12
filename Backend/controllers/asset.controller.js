// controllers/asset.controller.js
import db from '../database/db.js';

export const registerAsset = async (req, res) => {
    const {
        name,
        category_id,
        serial_number,
        acquisition_date,
        acquisition_cost,
        condition,
        location,
        is_bookable,
        photo_url
    } = req.body;

    // Basic validation
    if (!name || !category_id || !acquisition_date || !condition || !location) {
        return res.status(400).json({ error: 'Required fields are missing.' });
    }

    const client = await db.pool.connect();

    try {
        // Start a transaction to ensure tag generation and insertion are atomic
        await client.query('BEGIN');

        // 1. Check if serial number already exists (if provided)
        if (serial_number) {
            const existingSerial = await client.query(
                'SELECT id FROM assets WHERE serial_number = $1',
                [serial_number]
            );
            if (existingSerial.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'An asset with this serial number already exists.' });
            }
        }

        // 2. Auto-generate the next Asset Tag (e.g., AF-0129)
        // Find the highest number in existing tags
        const tagQuery = await client.query(
            "SELECT asset_tag FROM assets WHERE asset_tag LIKE 'AF-%' ORDER BY id DESC LIMIT 1"
        );

        let nextNum = 1;
        if (tagQuery.rows.length > 0) {
            const lastTag = tagQuery.rows[0].asset_tag; // e.g., "AF-0128"
            const lastNum = parseInt(lastTag.replace('AF-', ''), 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        const assetTag = `AF-${String(nextNum).padStart(4, '0')}`; // Formats to AF-0001, AF-0129, etc.

        // 3. Insert the new asset (Defaults to 'AVAILABLE' state) [1]
        const assetInsert = await client.query(
            `INSERT INTO assets (
        asset_tag, serial_number, name, category_id, acquisition_date, 
        acquisition_cost, condition, location, is_bookable, status, photo_url
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'AVAILABLE'::asset_status, $10)
       RETURNING *`,
            [
                assetTag,
                serial_number || null,
                name,
                parseInt(category_id, 10),
                acquisition_date,
                acquisition_cost ? parseFloat(acquisition_cost) : null,
                condition,
                location,
                is_bookable || false,
                photo_url || null
            ]
        );

        const newAsset = assetInsert.rows[0];

        // 4. Log to audit_logs so the Dashboard "Recent Activity" update triggers [1]
        const auditDetails = {
            message: `${newAsset.name} (${newAsset.asset_tag}) was registered by ${req.user.name}`,
            location: newAsset.location,
            type: 'asset'
        };

        await client.query(
            `INSERT INTO audit_logs (user_id, action, details) 
       VALUES ($1, 'ASSET_REGISTRATION', $2)`,
            [req.user.id, JSON.stringify(auditDetails)]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Asset registered successfully.',
            asset: newAsset
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during asset registration:', error);
        res.status(500).json({ error: 'Failed to register new asset.' });
    } finally {
        client.release();
    }
};