const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all businesses for an accountant
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM businesses');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

// Add new business
router.post('/', async (req, res) => {
    const { name, email, phone, administrator_id } = req.body;

    try {

        const existing = await pool.query(
            'SELECT * FROM businesses WHERE administrator_id = $1',
            [administrator_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Administrator already has a business' });
        }


        const result = await pool.query(
            'INSERT INTO businesses (name, email, phone, administrator_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone, administrator_id]
        );

        const business_id = result.rows[0].id;


        await pool.query(
            'UPDATE users SET business_id = $1 WHERE user_id = $2',
            [business_id, administrator_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating business:', err.message);
        res.status(500).json({ error: 'Failed to create business' });
    }
});

// Get business by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Business not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching business by ID:', err);
        res.status(500).json({ error: 'Failed to fetch business' });
    }
});




module.exports = router;