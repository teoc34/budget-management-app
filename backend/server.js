// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Initialize app
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Allow frontend to access backend
app.use(express.json()); // Parse JSON body

// PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test DB Connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch(err => console.error('❌ Database connection error:', err.stack));

// Import routes
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/api/transactions', transactionRoutes); // For /api/transactions
app.use('/api', userRoutes); // For /api/users etc.
app.use('/api', authRoutes); // Add this line


// Home Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Budget Management API!' });
});

// Start the Server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
