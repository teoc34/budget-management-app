// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all transactions
router.get('/', async (req, res) => {
    const { user_id } = req.query;
    try {
        const result = await pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC',
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { user_id, amount, category, note, transaction_date } = req.body;

    try {

        const businessResult = await pool.query(
            'SELECT business_id FROM users WHERE user_id = $1',
            [user_id]
        );

        const business_id = businessResult.rows[0]?.business_id;


        const result = await pool.query(
            'INSERT INTO transactions (user_id, amount, category, note, transaction_date, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, amount, category, note, transaction_date, business_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting transaction:', err);
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
