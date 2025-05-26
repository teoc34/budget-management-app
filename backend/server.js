require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch(err => console.error('❌ Database connection error:', err.stack));

// Routes
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const businessRoutes = require('./routes/businessRoutes');
const accountantBusinessRoutes = require('./routes/accountantBusinessRoutes');


app.use('/api/businesses', businessRoutes);
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accountants', accountantBusinessRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Budget Management API!' });
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
