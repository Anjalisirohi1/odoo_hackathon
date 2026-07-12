import jwt from 'jsonwebtoken';
import db from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow_secret_key_123';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token is missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const userQuery = await db.query(
            'SELECT id, name, email, role, status, department_id FROM users WHERE id = $1',
            [decoded.userId]
        );

        const user = userQuery.rows[0];

        if (!user || user.status === 'INACTIVE') {
            return res.status(403).json({ error: 'User is inactive or no longer exists' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Unauthorized role.' });
        }
        next();
    };
};