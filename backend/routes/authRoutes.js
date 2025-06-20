const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Signup Route
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
            [name, email, hashedPassword, role || 'user']
        );
        res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});


// Signin Route
router.post('/signin', async (req, res) => {
    console.log('🔐 /signin endpoint hit');

    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'No account found with this email' });
        }

        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                user_id: user.user_id
            },
            token
        });

    } catch (err) {
        console.error('Error during signin:', err);
        return res.status(500).json({ error: 'Signin failed' });
    }
});


module.exports = router;
