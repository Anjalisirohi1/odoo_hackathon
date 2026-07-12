import db from '../database/db.js';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const getMaintenanceRequests = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT mr.id,
             mr.asset_id,
             mr.issue_description,
             mr.priority,
             mr.status,
             mr.technician_name,
             mr.created_at,
             a.asset_tag,
             a.name AS asset_name,
             u.name AS raised_by_name
      FROM maintenance_requests mr
      LEFT JOIN assets a ON a.id = mr.asset_id
      LEFT JOIN users u ON u.id = mr.created_by_id
      ORDER BY mr.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Unable to retrieve maintenance requests.' });
  }
};

export const createMaintenanceRequest = async (req, res) => {
  const { asset_id, issue_description, priority } = req.body;

  if (!asset_id || !issue_description) {
    return res.status(400).json({ error: 'Asset and issue description are required.' });
  }

  const normalizedPriority = (priority || 'MEDIUM').toUpperCase();
  if (!VALID_PRIORITIES.includes(normalizedPriority)) {
    return res.status(400).json({ error: 'Priority must be LOW, MEDIUM, or HIGH.' });
  }

  try {
    const assetResult = await db.query('SELECT id FROM assets WHERE id = $1', [parseInt(asset_id, 10)]);
    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const result = await db.query(
      `INSERT INTO maintenance_requests (
          asset_id, issue_description, priority, status, created_by_id
       ) VALUES ($1, $2, $3, 'PENDING', $4)
       RETURNING id, asset_id, issue_description, priority, status, technician_name, created_at`,
      [parseInt(asset_id, 10), issue_description, normalizedPriority, req.user?.id || null]
    );

    res.status(201).json({ message: 'Maintenance request created.', request: result.rows[0] });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ error: 'Unable to create maintenance request.' });
  }
};

export const updateMaintenanceRequest = async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  const { status, technician_name } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required.' });
  }

  if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid maintenance status.' });
  }

  try {
    const updateFields = [];
    const params = [];
    let idx = 1;

    if (status) {
      updateFields.push(`status = $${idx++}::maintenance_status`);
      params.push(status.toUpperCase());
    }
    if (technician_name !== undefined) {
      updateFields.push(`technician_name = $${idx++}`);
      params.push(technician_name || null);
    }
    if (status && status.toUpperCase() === 'APPROVED') {
      updateFields.push(`approved_by_id = $${idx++}`);
      params.push(req.user?.id || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    params.push(requestId);

    const result = await db.query(
      `UPDATE maintenance_requests
       SET ${updateFields.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    res.status(200).json({ message: 'Maintenance request updated.', request: result.rows[0] });
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ error: 'Unable to update maintenance request.' });
  }
};
