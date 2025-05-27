const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Link accountant to a business
router.post('/associate', async (req, res) => {
    const { accountant_id, business_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO accountant_businesses (accountant_id, business_id) VALUES ($1, $2)',
            [accountant_id, business_id]
        );
        res.status(201).json({ message: 'Business linked successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to link business' });
    }
});


// businesses for an accountant
router.get('/:accountant_id', async (req, res) => {
    const { accountant_id } = req.params;
    try {
        const result = await pool.query(`
            SELECT b.* FROM businesses b
            JOIN accountant_businesses ab ON b.business_id = ab.business_id
            WHERE ab.accountant_id = $1
        `, [accountant_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

module.exports = router;
