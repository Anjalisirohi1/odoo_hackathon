import db from '../database/db.js';

export const getTransferDetails = async (req, res) => {
    const assetId = parseInt(req.params.assetId, 10);
    if (!assetId) {
        return res.status(400).json({ error: 'Asset ID is required.' });
    }

    try {
        const assetResult = await db.query(
            `SELECT id, asset_tag, name, serial_number, location, condition, status
             FROM assets
             WHERE id = $1`,
            [assetId]
        );

        if (assetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found.' });
        }

        const asset = assetResult.rows[0];

        const currentHolderResult = await db.query(
            `SELECT u.id, u.name, u.department_id, d.name AS department_name
             FROM allocations a
             JOIN users u ON u.id = a.employee_id
             LEFT JOIN departments d ON d.id = u.department_id
             WHERE a.asset_id = $1 AND a.status = 'ACTIVE'
             ORDER BY a.allocated_at DESC
             LIMIT 1`,
            [assetId]
        );

        const currentHolder = currentHolderResult.rows[0] || null;

        const eligibleHoldersResult = await db.query(
            `SELECT id, name, department_id
             FROM users
             WHERE status = 'ACTIVE' AND id <> $1
             ORDER BY name ASC`,
            [currentHolder ? currentHolder.id : 0]
        );

        const historyResult = await db.query(
            `SELECT tr.id, tr.status, tr.created_at,
                    fu.name AS from_name, tu.name AS to_name, ru.name AS requested_by_name
             FROM transfer_requests tr
             LEFT JOIN users fu ON fu.id = tr.from_user_id
             LEFT JOIN users tu ON tu.id = tr.to_user_id
             LEFT JOIN users ru ON ru.id = tr.requested_by_id
             WHERE tr.asset_id = $1
             ORDER BY tr.created_at DESC
             LIMIT 8`,
            [assetId]
        );

        res.status(200).json({
            asset,
            currentHolder,
            eligibleHolders: eligibleHoldersResult.rows,
            history: historyResult.rows.map((row) => ({
                id: row.id,
                status: row.status,
                date: row.created_at,
                fromName: row.from_name,
                toName: row.to_name,
                requestedByName: row.requested_by_name,
            })),
        });
    } catch (error) {
        console.error('Error fetching transfer details:', error);
        res.status(500).json({ error: 'Unable to load transfer details.' });
    }
};

export const createTransferRequest = async (req, res) => {
    const { asset_id, new_holder_id, reason } = req.body;

    if (!asset_id || !new_holder_id || !reason) {
        return res.status(400).json({ error: 'Asset, new holder, and reason are required.' });
    }

    try {
        const assetResult = await db.query(
            `SELECT id, asset_tag, name, location, status FROM assets WHERE id = $1`,
            [parseInt(asset_id, 10)]
        );

        if (assetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found.' });
        }
        const asset = assetResult.rows[0];

        const currentHolderResult = await db.query(
            `SELECT u.id
             FROM allocations a
             JOIN users u ON u.id = a.employee_id
             WHERE a.asset_id = $1 AND a.status = 'ACTIVE'
             ORDER BY a.allocated_at DESC
             LIMIT 1`,
            [parseInt(asset_id, 10)]
        );

        if (currentHolderResult.rows.length === 0) {
            return res.status(400).json({ error: 'Asset is not currently allocated to anyone, so it cannot be transferred.' });
        }

        const existingRequest = await db.query(
            `SELECT id FROM transfer_requests
             WHERE asset_id = $1 AND status = 'PENDING'
             LIMIT 1`,
            [parseInt(asset_id, 10)]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(409).json({ error: 'A pending transfer request already exists for this asset.' });
        }

        const result = await db.query(
            `INSERT INTO transfer_requests (asset_id, requested_by_id, from_user_id, to_user_id, status)
             VALUES ($1, $2, $3, $4, 'PENDING')
             RETURNING id, asset_id, requested_by_id, from_user_id, to_user_id, status, created_at`,
            [
                parseInt(asset_id, 10),
                req.user.id,
                currentHolderResult.rows[0].id,
                parseInt(new_holder_id, 10),
            ]
        );

        await db.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [
                req.user.id,
                'TRANSFER_REQUESTED',
                JSON.stringify({
                    type: 'asset',
                    message: `Transfer requested for ${asset.name} (${asset.asset_tag}): ${reason}`,
                    location: asset.location,
                }),
            ]
        );

        res.status(201).json({
            message: 'Transfer request submitted successfully.',
            request: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating transfer request:', error);
        res.status(500).json({ error: 'Unable to submit transfer request.' });
    }
};
