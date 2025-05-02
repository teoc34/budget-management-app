require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);


// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON requests

// PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test DB Connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch(err => console.error('❌ Database connection error:', err.stack));

// Sample Route - Home
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Budget Management API!' });
});

// Route to Get All Users (Example)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users'); // Replace "users" with your table name
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to Add a New User (Example)
app.post('/api/users', async (req, res) => {
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

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
