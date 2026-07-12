// controllers/assets.controller.js
import db from '../database/db.js';

const ASSET_STATUSES = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];

export const listAssets = async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const { search, category, status, department } = req.query;

    const conditions = [];
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(a.asset_tag ILIKE $${params.length} OR a.serial_number ILIKE $${params.length} OR a.name ILIKE $${params.length})`);
    }
    if (category) {
        params.push(category);
        conditions.push(`a.category_id = $${params.length}`);
    }
    if (status) {
        if (!ASSET_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid status filter.' });
        }
        params.push(status);
        conditions.push(`a.status = $${params.length}::asset_status`);
    }
    if (department) {
        params.push(department);
        conditions.push(`al.department_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const listQuery = `
            SELECT
                a.id,
                a.asset_tag,
                a.name,
                a.status,
                a.location,
                a.condition,
                a.acquisition_cost,
                c.name AS category_name,
                d.name AS department_name
            FROM assets a
            LEFT JOIN asset_categories c ON c.id = a.category_id
            LEFT JOIN allocations al ON al.asset_id = a.id AND al.status = 'ACTIVE'
            LEFT JOIN departments d ON d.id = al.department_id
            ${whereClause}
            ORDER BY a.id DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM assets a
            LEFT JOIN allocations al ON al.asset_id = a.id AND al.status = 'ACTIVE'
            ${whereClause}
        `;

        const [listResult, countResult] = await Promise.all([
            db.query(listQuery, [...params, limit, offset]),
            db.query(countQuery, params),
        ]);

        const total = countResult.rows[0].total;

        res.status(200).json({
            assets: listResult.rows.map((row) => ({
                id: row.id,
                tag: row.asset_tag,
                name: row.name,
                category: row.category_name,
                status: row.status,
                location: row.location,
                condition: row.condition,
                acquisitionCost: row.acquisition_cost,
                department: row.department_name,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            },
        });
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({ error: 'Failed to retrieve assets.' });
    }
};

export const getAssetSummary = async (req, res) => {
    try {
        const [valuationRes, healthRes, maintenanceRes] = await Promise.all([
            db.query(`SELECT COALESCE(SUM(acquisition_cost), 0)::numeric AS total FROM assets WHERE status NOT IN ('DISPOSED', 'RETIRED')`),
            db.query(`
                SELECT
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status NOT IN ('UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'))::int AS healthy
                FROM assets
            `),
            db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'REJECTED'))::int AS open_tickets,
                    COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'REJECTED') AND priority = 'HIGH')::int AS urgent_tickets
                FROM maintenance_requests
            `),
        ]);

        const { total, healthy } = healthRes.rows[0];
        const assetHealth = total > 0 ? Math.round((healthy / total) * 1000) / 10 : 0;

        res.status(200).json({
            totalValuation: Number(valuationRes.rows[0].total),
            maintenanceLoad: {
                openTickets: maintenanceRes.rows[0].open_tickets,
                urgentTickets: maintenanceRes.rows[0].urgent_tickets,
            },
            assetHealth,
        });
    } catch (error) {
        console.error('Error building asset summary:', error);
        res.status(500).json({ error: 'Failed to retrieve asset summary.' });
    }
};

export const listAssetCategories = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.id, c.name, COUNT(a.id)::int AS asset_count
            FROM asset_categories c
            LEFT JOIN assets a ON a.category_id = c.id
            GROUP BY c.id, c.name
            ORDER BY c.name
        `);
        res.status(200).json({
            categories: result.rows.map((row) => ({ id: row.id, name: row.name, assetCount: row.asset_count })),
        });
    } catch (error) {
        console.error('Error listing asset categories:', error);
        res.status(500).json({ error: 'Failed to retrieve asset categories.' });
    }
};

export const listAssetDepartments = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.id, d.name, d.status, d.parent_department_id, pd.name AS parent_name, d.department_head_id, u.name AS head_name
            FROM departments d
            LEFT JOIN departments pd ON pd.id = d.parent_department_id
            LEFT JOIN users u ON u.id = d.department_head_id
            ORDER BY d.name
        `);
        res.status(200).json({
            departments: result.rows.map((row) => ({
                id: row.id,
                name: row.name,
                status: row.status,
                parentId: row.parent_department_id,
                parentName: row.parent_name,
                headId: row.department_head_id,
                headName: row.head_name,
            })),
        });
    } catch (error) {
        console.error('Error listing departments:', error);
        res.status(500).json({ error: 'Failed to retrieve departments.' });
    }
};

export const createAssetCategory = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO asset_categories (name) VALUES ($1) RETURNING id, name`,
            [name.trim()]
        );
        res.status(201).json({ category: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'A category with that name already exists.' });
        }
        console.error('Error creating asset category:', error);
        res.status(500).json({ error: 'Failed to create category.' });
    }
};

export const createDepartment = async (req, res) => {
    const { name, parent_department_id, department_head_id, status } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Department name is required.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO departments (name, parent_department_id, department_head_id, status)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, parent_department_id, department_head_id, status`,
            [
                name.trim(),
                parent_department_id ? parseInt(parent_department_id, 10) : null,
                department_head_id ? parseInt(department_head_id, 10) : null,
                status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            ]
        );
        res.status(201).json({ department: result.rows[0] });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Failed to create department.' });
    }
};

export const updateDepartmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error: 'status must be ACTIVE or INACTIVE.' });
    }

    try {
        const result = await db.query(
            `UPDATE departments SET status = $1 WHERE id = $2 RETURNING id, name, status`,
            [status, parseInt(id, 10)]
        );
        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Department not found.' });
        }
        res.status(200).json({ department: result.rows[0] });
    } catch (error) {
        console.error('Error updating department status:', error);
        res.status(500).json({ error: 'Failed to update department.' });
    }
};

export const createAsset = async (req, res) => {
    const {
        name,
        category_id,
        serial_number,
        acquisition_date,
        acquisition_cost,
        condition,
        location,
        is_bookable,
    } = req.body;

    if (!name || !acquisition_date || !condition || !location) {
        return res.status(400).json({ error: 'name, acquisition_date, condition, and location are required.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Serialize concurrent asset creation so two requests can't compute the same next tag.
        await client.query('LOCK TABLE assets IN SHARE ROW EXCLUSIVE MODE');

        const tagResult = await client.query(
            `SELECT COALESCE(MAX(SUBSTRING(asset_tag FROM 'AF-(\\d+)')::int), 0) + 1 AS next_num
             FROM assets`
        );
        const nextTag = `AF-${String(tagResult.rows[0].next_num).padStart(4, '0')}`;

        const insertResult = await client.query(
            `INSERT INTO assets (asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, is_bookable, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'AVAILABLE')
             RETURNING id, asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, is_bookable, status`,
            [nextTag, name, category_id ?? null, serial_number ?? null, acquisition_date, acquisition_cost ?? null, condition, location, Boolean(is_bookable)]
        );
        const asset = insertResult.rows[0];

        await client.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [
                req.user.id,
                'ASSET_REGISTERED',
                JSON.stringify({ type: 'asset', message: `${asset.name} (${asset.asset_tag}) registered`, location: asset.location }),
            ]
        );

        await client.query('COMMIT');
        res.status(201).json({ asset });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(400).json({ error: 'An asset with that serial number already exists.' });
        }
        console.error('Error creating asset:', error);
        res.status(500).json({ error: 'Failed to register asset.' });
    } finally {
        client.release();
    }
};
