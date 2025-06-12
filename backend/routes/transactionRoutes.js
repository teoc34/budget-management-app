const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const exceljs = require('exceljs');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { spawn } = require('child_process');
const verifyToken = require('../middleware/verifyToken');
const { runPatternAnalysis } = require('../scripts/ml-patterns-wrapper');


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
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.user_id;
    const role = req.user.role;
    const businessId = req.query.business_id;

    try {
        let result;

        if (role === 'accountant') {
            if (!businessId) {
                return res.status(400).json({ error: 'Business ID required for accountants' });
            }

            result = await pool.query(`
                SELECT t.*, u.name AS added_by
FROM transactions t
JOIN users u ON t.user_id = u.user_id
WHERE t.business_id = $1
  AND (
    t.transaction_type = 'income'
    OR (t.transaction_type = 'expense' AND t.is_business_expense = true)
  )
ORDER BY t.transaction_date DESC

            `, [businessId]);

        } else if (role === 'administrator') {
            result = await pool.query(`
    SELECT 
    t.transaction_id,
    t.user_id,
    t.amount,
    t.transaction_type,
    CASE 
        WHEN u.role = 'user' THEN 'Employee Spendings'
        ELSE t.category
    END AS category,
    t.note,
    t.transaction_date,
    t.business_id,
    t.is_business_expense,
    t.client_name,
    u.name AS added_by
FROM transactions t
JOIN users u ON t.user_id = u.user_id
WHERE t.business_id IN (
    SELECT business_id FROM businesses WHERE created_by = $1
)
AND (
    t.transaction_type = 'income'
    OR (t.transaction_type = 'expense' AND t.is_business_expense = true)
)
ORDER BY t.transaction_date DESC

`, [userId]);

        } else {
            result = await pool.query(`
                SELECT t.*, u.name AS added_by, t.transaction_type
                FROM transactions t
                JOIN users u ON t.user_id = u.user_id
                WHERE t.user_id = $1
                ORDER BY t.transaction_date DESC
            `, [userId]);
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});





// Add transaction
router.post('/', verifyToken, async (req, res) => {
    const userId = req.user.user_id;
    const role = req.user.role;
    const { amount, category, note, transaction_date, business_id, is_business_expense } = req.body;
    const added_by = userId;

    // 🔹 PASUL 2 – logica pentru businessId
    let businessId = null;

    if (role === 'administrator' || role === 'accountant') {
        businessId = business_id || null;
    } else if (role === 'user') {
        if (is_business_expense === true) {
            businessId = req.user.business_id;
        } else {
            businessId = null;
        }
    }

    try {
        const result = await pool.query(
            `INSERT INTO transactions 
             (user_id, amount, category, note, transaction_date, business_id, added_by, is_business_expense) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [userId, amount, category, note, transaction_date, businessId, added_by, is_business_expense]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting transaction:', err);
        res.status(500).json({ error: err.message });
    }
});



// Export transactions
router.get('/export', verifyToken, async (req, res) => {
    const { start, end, category, business_id, format = 'excel' } = req.query;
    const userId = req.user.user_id;
    const role = req.user.role;

    try {
        let query = `
  SELECT 
    t.transaction_date AS date, 
    t.note AS description, 
    t.category, 
    t.amount,
    t.added_by,
    b.name AS business
  FROM transactions t
  JOIN users u ON t.user_id = u.user_id
  LEFT JOIN businesses b ON t.business_id = b.business_id
  WHERE 1=1
`;


        const params = [];

        if (role === 'user') {
            query += ` AND t.user_id = $${params.length + 1}`;
            params.push(user_id);
        } else if ((role === 'accountant' || role === 'administrator') && business_id) {
            query += ` AND t.business_id = $${params.length + 1} AND t.is_business_expense = true`;
            params.push(business_id);
        }


        if (start && end) {
            query += ` AND t.transaction_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
            params.push(start, end);
        }
        if (category) {
            query += ` AND t.category = $${params.length + 1}`;
            params.push(category);
        }
        if (business_id) {
            query += ` AND t.business_id = $${params.length + 1}`;
            params.push(business_id);
        }



        const result = await pool.query(query, params);

        if (format === 'excel') {
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Transactions');

            worksheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Description', key: 'description', width: 30 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Amount', key: 'amount', width: 10 },
                { header: 'Added By', key: 'added_by', width: 20 },
                { header: 'Business', key: 'business', width: 25 }
            ];



            result.rows.forEach(row => worksheet.addRow(row));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');

            doc.pipe(res);
            doc.fontSize(18).text('Transactions Report', { align: 'center' }).moveDown();

            result.rows.forEach(tx => {
                doc.fontSize(12).text(`Date: ${tx.date}`);
                doc.text(`Category: ${tx.category}`);
                doc.text(`Description: ${tx.description}`);
                doc.text(`Amount: ${tx.amount} RON`);
                doc.text(`Added By: ${tx.added_by}`);
                doc.text(`Business: ${tx.business}`);
                doc.moveDown();
            });

            doc.end();
        } else {
            res.status(400).json({ error: 'Unsupported format.' });
        }

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// Machine learning insights
router.post('/ml-insights', verifyToken, async (req, res) => {
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

router.get('/incomes', async (req, res) => {
    const userId = req.user.user_id;
    const role = req.user.role;
    const businessId = req.query.business_id;

    try {
        let query = 'SELECT * FROM transactions WHERE transaction_type = $1';
        let values = ['income'];

        if (role === 'user') {
            query += ' AND user_id = $2';
            values.push(userId);
        } else if ((role === 'accountant' || role === 'administrator') && businessId) {
            query += ' AND business_id = $2';
            values.push(businessId);
        }

        query += ' ORDER BY client_name ASC, business_id ASC, transaction_date ASC';

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching incomes:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


router.post('/incomes', async (req, res) => {
    const { amount, client_name, transaction_date, note, business_id } = req.body;
    const userId = req.user.user_id;
    // DOAR dacă este accountant
    if (role === 'accountant' && businessId) {
        // Verifică dacă business-ul chiar e gestionat de acest accountant
        const accessCheck = await pool.query(
            `SELECT 1 FROM accountant_businesses WHERE accountant_id = $1 AND business_id = $2`,
            [userId, businessId]
        );
        if (accessCheck.rowCount === 0) {
            return res.status(403).json({ error: "Access denied to this business" });
        }
    }


    try {
        const result = await pool.query(
            `INSERT INTO transactions 
             (user_id, amount, client_name, transaction_date, note, business_id, transaction_type)
             VALUES ($1, $2, $3, $4, $5, $6, 'income') 
             RETURNING *`,
            [userId, amount, client_name, transaction_date, note, business_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting income:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/businesses', async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'SELECT * FROM businesses WHERE created_by = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/transactions/ml-anomalies
router.post('/ml-anomalies', verifyToken, async (req, res) => {
    try {
        const inputData = JSON.stringify(req.body);

        const python = spawn('python', ['scripts/ml-anomalies.py']);

        let output = '';
        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        let errorOutput = '';
        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.stdin.write(inputData);
        python.stdin.end();

        python.on('close', (code) => {
            if (code !== 0 || errorOutput) {
                console.error('Python error:', errorOutput);
                return res.status(500).json({ error: 'Anomaly detection failed.' });
            }

            try {
                const result = JSON.parse(output);
                return res.json(result);
            } catch (err) {
                console.error('Parsing error:', err);
                return res.status(500).json({ error: 'Failed to parse Python output.' });
            }
        });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Server error.' });
    }
});

router.post('/ml-behavior', verifyToken, async (req, res) => {
    try {
        const transactions = req.body.map(tx => ({
            ...tx,
            type: tx.type || (parseFloat(tx.amount) >= 0 ? 'income' : 'expense')
        }));

        const python = spawn('python', ['scripts/ml-behavior.py']);

        let output = '';
        python.stdout.on('data', data => output += data.toString());
        python.stderr.on('data', err => console.error('stderr:', err.toString()));

        python.stdin.write(JSON.stringify(transactions));
        python.stdin.end();

        python.on('close', code => {
            if (code !== 0) return res.status(500).json({ error: 'Script failed' });

            try {
                res.json(JSON.parse(output));
            } catch {
                res.status(500).json({ error: 'Invalid JSON from Python' });
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// POST /api/transactions/ml-predict-category
router.post('/ml-predict-category', verifyToken, async (req, res) => {
    try {
        const inputData = JSON.stringify(req.body);
        const isWindows = process.platform === 'win32';
        const python = spawn(isWindows ? 'python' : 'python3', ['scripts/ml-predict-category.py']);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', data => output += data.toString());
        python.stderr.on('data', data => errorOutput += data.toString());

        python.stdin.write(inputData);
        python.stdin.end();

        python.on('close', code => {
            if (code !== 0 || errorOutput) {
                console.error('Python error:', errorOutput);
                return res.status(500).json({ error: 'Prediction failed.' });
            }

            try {
                const result = JSON.parse(output);
                return res.json(result);
            } catch (err) {
                return res.status(500).json({ error: 'Invalid Python output' });
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/ml-patterns', async (req, res) => {
    try {
        const result = await runPatternAnalysis(req.body.user_id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Pattern analysis failed' });
    }
});

module.exports = router;
