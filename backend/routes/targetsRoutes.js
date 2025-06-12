const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken'); // dacă e nevoie
const pool = require('../config/database');

router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { month } = req.query;

        const result = await pool.query(
            'SELECT category, target_amount FROM category_targets WHERE user_id = $1 AND month = $2',
            [userId, month]
        );

        const targets = {};
        result.rows.forEach(row => {
            targets[row.category] = row.target_amount;
        });

        res.json(targets);
    } catch (error) {
        console.error('Error fetching targets:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // luat din token
        const { category, target_amount, month } = req.body;

        await pool.query(
            'INSERT INTO category_targets (user_id, category, target_amount, month) VALUES ($1, $2, $3, $4)',
            [userId, category.toLowerCase(), target_amount, month]
        );

        res.status(201).json({ message: 'Target saved successfully' });
    } catch (error) {
        console.error('Error saving target:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
