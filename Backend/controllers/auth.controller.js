// controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123';

// 1. Signup (Forces EMPLOYEE role)
export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, 'EMPLOYEE'::user_role, 'ACTIVE'::user_status) 
       RETURNING id, name, email, role, status`,
            [name, email, passwordHash]
        );

        const newUser = result.rows[0];
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '8h' });

        res.status(201).json({ user: newUser, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register account.' });
    }
};

// 2. Login
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || user.status === 'INACTIVE') {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                departmentId: user.department_id
            },
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to login.' });
    }
};

// 3. Get Current User (Me)
export const getMe = (req, res) => {
    res.status(200).json({ user: req.user });
};

// 4. Forgot Password (Mock Console Logger)
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    try {
        const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(200).json({ message: 'If that email exists, reset instructions have been sent.' });
        }

        const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        console.log(`\x1b[33m%s\x1b[0m`, `[MOCK EMAIL SENDER] Reset Link: http://localhost:3000/reset-password?token=${resetToken}`);

        res.status(200).json({ message: 'If that email exists, reset instructions have been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending request.' });
    }
};

// 5. Admin-Only Promotion (Preps for Screen 3)
export const promoteUser = async (req, res) => {
    const { id } = req.params;
    const { role, departmentId } = req.body;

    if (!['EMPLOYEE', 'DEPT_HEAD', 'ASSET_MANAGER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role choice.' });
    }

    try {
        const result = await db.query(
            `UPDATE users 
       SET role = $1::user_role, department_id = $2 
       WHERE id = $3 
       RETURNING id, name, email, role, department_id`,
            [role, departmentId ? parseInt(departmentId) : null, parseInt(id)]
        );

        const updatedUser = result.rows[0];

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({ message: 'Role modified successfully.', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user profile.' });
    }
};