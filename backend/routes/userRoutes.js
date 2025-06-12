const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const verifyToken = require('../middleware/verifyToken');

// Get all users
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new user
router.post('/', async (req, res) => {
    const { name, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET current user's info using JWT token
router.get('/me', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.get('/employees', verifyToken, async (req, res) => {
    const { role } = req.user;
    if (role !== 'administrator' && role !== 'accountant') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const result = await pool.query(
            'SELECT user_id, name, email FROM users WHERE role = $1',
            ['user']
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Get a specific user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user:', err.message);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user details
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    let { phone, address, emergency_contact, business_id } = req.body;

    try {
        if (business_id === '') {
            business_id = null;
        }

        const result = await pool.query(
            `UPDATE users
             SET phone = $1,
                 address = $2,
                 emergency_contact = $3,
                 business_id = $4
             WHERE user_id = $5
             RETURNING *`,
            [phone || null, address || null, emergency_contact || null, business_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', verifyToken, async (req, res) => {
    const { role } = req.user;
    if (role !== 'administrator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const userId = req.params.id;
        await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/by-business/:business_id
router.get('/by-business/:business_id', verifyToken, async (req, res) => {
    const { role } = req.user;
    if (role !== 'administrator') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { business_id } = req.params;
        const result = await pool.query(
            'SELECT user_id, name, email, role FROM users WHERE business_id = $1 AND role != $2',
            [business_id, 'administrator']
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users by business:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// PATCH /api/users/:id/set-salary
router.patch('/:id/set-salary', verifyToken, async (req, res) => {
    const userId = req.params.id;
    const { salary } = req.body;

    if (!salary || isNaN(salary)) {
        return res.status(400).json({ error: 'Invalid salary value' });
    }

    try {
        await pool.query(
            'UPDATE users SET salary = $1 WHERE user_id = $2',
            [salary, userId]
        );

        res.status(200).json({ message: 'Salary updated successfully' });
    } catch (err) {
        console.error('Error updating salary:', err);
        res.status(500).json({ error: 'Failed to update salary' });
    }
});


module.exports = router;
