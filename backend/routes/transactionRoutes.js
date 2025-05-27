const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const exceljs = require('exceljs');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { spawn } = require('child_process');

// Get transactions between two dates
const getTransactions = async (start, end) => {
    const query = `
        SELECT t.*, u.name AS added_by
        FROM transactions t
        JOIN users u ON t.user_id = u.user_id
        WHERE t.transaction_date BETWEEN $1 AND $2
        ORDER BY t.transaction_date DESC
    `;
    const result = await pool.query(query, [start, end]);
    return result.rows;
};

// Get transactions
router.get('/', async (req, res) => {
    const { user_id, business_id } = req.query;

    try {
        let result;

        if (business_id) {
            result = await pool.query(
                `
                SELECT t.*, u.name AS added_by
                FROM transactions t
                JOIN users u ON t.user_id = u.user_id
                WHERE t.business_id = $1
                ORDER BY t.transaction_date DESC
                `,
                [business_id]
            );
        } else if (user_id) {
            result = await pool.query(
                `
                SELECT t.*, u.name AS added_by
                FROM transactions t
                JOIN users u ON t.user_id = u.user_id
                WHERE t.user_id = $1
                ORDER BY t.transaction_date DESC
                `,
                [user_id]
            );
        } else {
            return res.status(400).json({ error: 'user_id or business_id required' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Add transaction
router.post('/', async (req, res) => {
    const { user_id, amount, category, note, transaction_date } = req.body;

    try {
        const businessResult = await pool.query(
            'SELECT business_id, role FROM users WHERE user_id = $1',
            [user_id]
        );

        const userData = businessResult.rows[0];
        const role = userData?.role;
        let business_id = userData?.business_id;

        // Allow override for accountant/admin
        if (role === 'accountant' || role === 'administrator') {
            business_id = req.body.business_id || null;
        }

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

// Export transactions
router.get('/export', async (req, res) => {
    const { format = 'excel', start, end } = req.query;
    const fromDate = start || '2000-01-01';
    const toDate = end || new Date().toISOString().split('T')[0];

    try {
        const transactions = await getTransactions(fromDate, toDate);

        if (format === 'pdf') {
            const doc = new PDFDocument();
            const filePath = path.join(__dirname, '../exports/transactions.pdf');
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            doc.fontSize(18).text('Transactions Report', { align: 'center' });
            doc.moveDown();

            transactions.forEach(tx => {
                doc.fontSize(12).text(`Date: ${tx.transaction_date}`);
                doc.text(`Category: ${tx.category}`);
                doc.text(`Amount: ${tx.amount} RON`);
                doc.text(`Note: ${tx.note || '-'}`);
                doc.text(`Added by: ${tx.added_by || 'Unknown'}`);
                doc.moveDown();
            });

            doc.end();

            writeStream.on('finish', () => {
                res.download(filePath, 'transactions.pdf');
            });
        } else {
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Transactions');

            worksheet.columns = [
                { header: 'Date', key: 'transaction_date', width: 20 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Note', key: 'note', width: 30 },
                { header: 'Added by', key: 'added_by', width: 20 },
            ];

            transactions.forEach(row => {
                worksheet.addRow({
                    transaction_date: row.transaction_date || '',
                    category: row.category || '',
                    amount: row.amount || 0,
                    note: row.note || '',
                    added_by: row.added_by || 'Unknown',
                });
            });

            const filePath = path.join(__dirname, '../exports/transactions.xlsx');
            await workbook.xlsx.writeFile(filePath);
            res.download(filePath, 'transactions.xlsx');
        }
    } catch (err) {
        console.error('Export failed:', err.message);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Machine learning insights (Python)
router.post('/ml-insights', async (req, res) => {
    const transactions = req.body;

    try {
        const python = spawn('python', ['scripts/insights.py']);

        let output = '';
        python.stdout.on('data', (data) => output += data.toString());
        python.stderr.on('data', (err) => console.error('Python Error:', err.toString()));

        python.on('close', () => {
            try {
                const insights = JSON.parse(output);
                res.json(insights);
            } catch (e) {
                console.error('Error parsing ML output:', e);
                res.status(500).json({ error: 'Failed to parse ML output' });
            }
        });

        python.stdin.write(JSON.stringify(transactions));
        python.stdin.end();
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'ML processing failed' });
    }
});

module.exports = router;
