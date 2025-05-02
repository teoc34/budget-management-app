// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all transactions
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions ORDER BY transaction_date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// POST new transaction
router.post('/', async (req, res) => {
    const { user_id, amount, category, note, transaction_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (user_id, amount, category, note, transaction_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, amount, category, note, transaction_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

module.exports = router;
