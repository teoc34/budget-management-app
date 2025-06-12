const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();
const verifyToken = require('../middleware/verifyToken');


const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM businesses');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).json({ error: err.message });
    }
});


// Add new business
router.post('/', async (req, res) => {
    const {
        name,
        email,
        phone,
        cui,
        vat_status,
        registration_date,
        company_type,
        administrator_id
    } = req.body;

    try {

        const existing = await pool.query(
            'SELECT * FROM businesses WHERE administrator_id = $1',
            [administrator_id]
        );

        if (existing.rows.length >= 3) {
            return res.status(400).json({ error: 'You can create a maximum of 3 businesses.' });
        }



        const result = await pool.query(
            `INSERT INTO businesses 
   (name, email, phone, cui, vat_status, registration_date, company_type, administrator_id) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
   RETURNING *`,
            [name, email, phone, cui, vat_status, registration_date, company_type, administrator_id]
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

// GET a single business by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM businesses WHERE business_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching business by ID:', err.message);
        res.status(500).json({ error: 'Failed to fetch business' });
    }
});

router.post('/accountants/associate', async (req, res) => {
    const { accountant_id, business_id } = req.body;

    if (!accountant_id || !business_id) {
        return res.status(400).json({ error: 'Missing accountant_id or business_id' });
    }

    try {
        await pool.query(
            'INSERT INTO accountant_businesses (accountant_id, business_id) VALUES ($1, $2)',
            [accountant_id, business_id]
        );
        res.status(201).json({ message: 'Business successfully associated with accountant' });
    } catch (err) {
        console.error('Error associating accountant to business:', err.message);
        res.status(500).json({ error: 'Association failed' });
    }
});

router.get('/by-owner/:owner_id', async (req, res) => {
    const { owner_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM businesses WHERE administrator_id = $1',
            [owner_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching businesses by owner:', err.message);
        res.status(500).json({ error: 'Failed to fetch businesses' });
    }
});

// DELETE business by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM businesses WHERE business_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }

        res.json({ message: 'Business deleted successfully' });
    } catch (err) {
        console.error('Error deleting business:', err.message);
        res.status(500).json({ error: 'Failed to delete business' });
    }
});

// backend/routes/businesses.js
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM businesses WHERE business_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching business:', err);
        res.status(500).json({ error: 'Server error' });
    }
});






module.exports = router;