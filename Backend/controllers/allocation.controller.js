import db from '../database/db.js';

export const createAllocation = async (req, res) => {
    const { asset_id, employee_id, department_id, expected_return_at } = req.body;

    if (!asset_id || !employee_id) {
        return res.status(400).json({ error: 'Asset and employee are required.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const assetResult = await client.query(
            `SELECT id, asset_tag, name, location, status FROM assets WHERE id = $1 FOR UPDATE`,
            [parseInt(asset_id, 10)]
        );
        const asset = assetResult.rows[0];

        if (!asset) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Asset not found.' });
        }
        if (asset.status !== 'AVAILABLE') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Asset is ${asset.status.toLowerCase()}, not available to allocate.` });
        }

        const employeeResult = await client.query(
            `SELECT id, name, department_id FROM users WHERE id = $1 AND status = 'ACTIVE'`,
            [parseInt(employee_id, 10)]
        );
        const employee = employeeResult.rows[0];
        if (!employee) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found or inactive.' });
        }

        const allocationResult = await client.query(
            `INSERT INTO allocations (asset_id, employee_id, department_id, allocated_at, expected_return_at, status)
             VALUES ($1, $2, $3, NOW(), $4, 'ACTIVE')
             RETURNING id, asset_id, employee_id, department_id, allocated_at, expected_return_at, status`,
            [
                parseInt(asset_id, 10),
                parseInt(employee_id, 10),
                department_id ? parseInt(department_id, 10) : employee.department_id ?? null,
                expected_return_at || null,
            ]
        );

        await client.query(`UPDATE assets SET status = 'ALLOCATED'::asset_status WHERE id = $1`, [asset.id]);

        await client.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [
                req.user.id,
                'ASSET_ALLOCATED',
                JSON.stringify({
                    type: 'asset',
                    message: `${asset.name} (${asset.asset_tag}) allocated to ${employee.name}`,
                    location: asset.location,
                }),
            ]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Asset allocated successfully.', allocation: allocationResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating allocation:', error);
        res.status(500).json({ error: 'Unable to allocate asset.' });
    } finally {
        client.release();
    }
};
