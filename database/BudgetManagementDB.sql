-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'accountant', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('income', 'expense')),
    transaction_date DATE NOT NULL,
    notes TEXT
);

-- Budgets Table
CREATE TABLE budgets (
    budget_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    limit_amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- Reports Table
CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    report_type VARCHAR(50) CHECK (report_type IN ('monthly', 'annual', 'comparison')),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatbot Logs Table
CREATE TABLE chatbot_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- test user
INSERT INTO users (name, email, password_hash, role)
VALUES ('John Doe', 'john@example.com', 'hashedpassword123', 'accountant');

-- test transaction
INSERT INTO transactions (user_id, amount, category, transaction_type, transaction_date, notes)
VALUES (1, 500.00, 'Office Supplies', 'expense', '2024-02-21', 'Purchased printer');

-- test budget
INSERT INTO budgets (user_id, category, limit_amount, start_date, end_date)
VALUES (1, 'Office Supplies', 1000.00, '2024-02-01', '2024-02-28');

SELECT * FROM users;

SELECT * FROM transactions;

SELECT * FROM budgets;

SELECT * FROM transactions WHERE user_id = 1;

-- budget utilization
SELECT b.category, b.limit_amount, SUM(t.amount) AS total_spent
FROM budgets b
LEFT JOIN transactions t ON b.user_id = t.user_id AND b.category = t.category
WHERE b.user_id = 1
GROUP BY b.category, b.limit_amount;

--Get Total Income and Expenses
SELECT transaction_type, SUM(amount) AS total_amount
FROM transactions
GROUP BY transaction_type;


--Get Total Expenses by Category
SELECT category, SUM(amount) AS total_spent
FROM transactions
WHERE transaction_type = 'expense'
GROUP BY category
ORDER BY total_spent DESC;

--Get Monthly Financial Summary
SELECT 
    DATE_TRUNC('month', transaction_date) AS month,
    SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) AS total_expenses
FROM transactions
GROUP BY month
ORDER BY month DESC;

--Compare Expenses Against Budget
SELECT 
    b.category, 
    b.limit_amount AS budgeted_amount, 
    COALESCE(SUM(t.amount), 0) AS total_spent,
    (b.limit_amount - COALESCE(SUM(t.amount), 0)) AS remaining_budget
FROM budgets b
LEFT JOIN transactions t 
    ON b.user_id = t.user_id AND b.category = t.category 
    AND t.transaction_type = 'expense'
WHERE b.user_id = 1 -- Change the ID for different users
GROUP BY b.category, b.limit_amount;

--Find Users Who Have Exceeded Their Budget
SELECT u.name, b.category, b.limit_amount, SUM(t.amount) AS total_spent
FROM users u
JOIN budgets b ON u.user_id = b.user_id
JOIN transactions t ON u.user_id = t.user_id AND b.category = t.category
WHERE t.transaction_type = 'expense'
GROUP BY u.name, b.category, b.limit_amount
HAVING SUM(t.amount) > b.limit_amount;

--Get Transactions for a Specific User
SELECT * FROM transactions WHERE user_id = 1 ORDER BY transaction_date DESC;

--Get Budgets for a Specific User
SELECT * FROM budgets WHERE user_id = 1;

--Retrieve User's Financial Summary for Chatbot
SELECT 
    u.name, 
    COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) AS net_balance
FROM users u
LEFT JOIN transactions t ON u.user_id = t.user_id
WHERE u.user_id = 1
GROUP BY u.name;

--Get Last 5 Transactions for Chatbot Query
SELECT category, amount, transaction_date 
FROM transactions
WHERE user_id = 1
ORDER BY transaction_date DESC
LIMIT 5;


