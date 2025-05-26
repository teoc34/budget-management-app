// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/transactions
router.get('/', async (req, res) => {
    const { user_id, business_id } = req.query;

    try {
        let result;
        if (business_id) {
            result = await pool.query(
                'SELECT * FROM transactions WHERE business_id = $1 ORDER BY transaction_date DESC',
                [business_id]
            );
        } else if (user_id) {
            result = await pool.query(
                'SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC',
                [user_id]
            );
        } else {
            return res.status(400).json({ error: 'user_id or business_id required' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});


router.post('/', async (req, res) => {
    const { user_id, amount, category, note, transaction_date, business_id: clientBusinessId, added_by } = req.body;

    try {
        // Get user role
        const userResult = await pool.query(
            'SELECT role, business_id FROM users WHERE user_id = $1',
            [user_id]
        );

        const user = userResult.rows[0];

        let business_id;

        if (user.role === 'administrator') {
            business_id = user.business_id;
        } else if (user.role === 'accountant') {
            business_id = clientBusinessId; // sent from frontend dropdown
        } else {
            return res.status(400).json({ error: 'Unsupported user role' });
        }

        const result = await pool.query(
            'INSERT INTO transactions (user_id, amount, category, note, transaction_date, business_id, added_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [user_id, amount, category, note, transaction_date, business_id, added_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting transaction:', err);
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
