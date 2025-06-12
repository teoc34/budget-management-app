import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import SmartBudgetSuggestions from '../components/SmartBudgetSuggestions';

const AccountHome = ({ user, selectedBusinessId, setSelectedBusinessId, accountantBusinesses }) => {
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedBusinessName, setSelectedBusinessName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');


    // Fetch transactions based on user role
    const fetchTransactions = async () => {
        try {
            let endpoint = 'http://localhost:5000/api/transactions';

            if (user.role === 'administrator' && selectedBusinessId) {
                endpoint += `?business_id=${selectedBusinessId}`;
            } else if (user.role === 'user') {
                endpoint += `?user_id=${user.user_id}`;
            }

            console.log("Fetching from:", endpoint); // Acum va include business_id

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            console.log("Loaded transactions:", data); // verifici răspunsul JSON

            setTransactions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setTransactions([]);
        }
    };



    // Fetch transactions and business name on change
    useEffect(() => {
        console.log("Loaded transactions:", transactions);
        fetchTransactions();

        if (selectedBusinessId) {
            fetch(`http://localhost:5000/api/businesses/${selectedBusinessId}`)
                .then(res => res.json())
                .then(data => setSelectedBusinessName(data?.name || ''))
                .catch(err => {
                    console.error('Failed to load business name:', err);
                    setSelectedBusinessName('');
                });
        } else {
            setSelectedBusinessName('');
        }
    }, [user, selectedBusinessId]);

    // Filter transactions by selected month
    const filteredTransactions = transactions.filter(tx => {
        const txMonth = new Date(tx.transaction_date).getMonth() + 1;
        const monthMatch = selectedMonth ? txMonth === Number(selectedMonth) : true;
        const categoryMatch = selectedCategory ? tx.category === selectedCategory : true;
        return monthMatch && categoryMatch;
    });


    // Prepare pie chart data by category
    const chartData = filteredTransactions.reduce((acc, tx) => {
        const found = acc.find(item => item.name === tx.category);
        if (found) {
            found.value += Number(tx.amount);
        } else {
            acc.push({ name: tx.category, value: Number(tx.amount) });
        }
        return acc;
    }, []);

    // Prepare line chart data for daily spending
    const dailySpendingData = transactions.reduce((acc, tx) => {
        const date = format(new Date(tx.transaction_date), 'dd MMM yyyy');
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing.amount += Number(tx.amount);
        } else {
            acc.push({ date, amount: Number(tx.amount) });
        }
        return acc.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, []);

    // Define chart colors
    const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

    // Prepare stacked bar chart data for monthly spending by category
    const monthlyCategoryData = transactions.reduce((acc, tx) => {
        const month = format(new Date(tx.transaction_date), 'yyyy-MM');
        const category = tx.category;
        const amount = Number(tx.amount);

        const found = acc.find(entry => entry.month === month);
        if (found) {
            found[category] = (found[category] || 0) + amount;
        } else {
            acc.push({ month, [category]: amount });
        }

        return acc;
    }, []);

    // Group income and expenses per month
    const incomeVsExpensesData = [];

    const groupedByMonth = {};

    transactions.forEach(tx => {
        const month = new Date(tx.transaction_date).toISOString().slice(0, 7); // ex: "2025-01"
        if (!groupedByMonth[month]) {
            groupedByMonth[month] = { income: 0, expenses: 0 };
        }
        if (tx.transaction_type?.toLowerCase() === 'income') {
            groupedByMonth[month].income += Number(tx.amount);
        } else if (tx.transaction_type?.toLowerCase() === 'expense') {
            groupedByMonth[month].expenses += Number(tx.amount);
        }

    });

    for (const month in groupedByMonth) {
        incomeVsExpensesData.push({
            month,
            income: groupedByMonth[month].income,
            expenses: groupedByMonth[month].expenses,
        });
    }


    const totalIncome = transactions
        .filter(tx => tx.transaction_type?.toLowerCase() === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpenses = transactions
        .filter(tx => tx.transaction_type?.toLowerCase() === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const profit = totalIncome - totalExpenses;

    const topClientsByIncome = [];

    if (user.role === 'administrator' || user.role === 'accountant') {
        const incomeMap = {};

        transactions
            .filter(tx => tx.transaction_type?.toLowerCase() === 'income')
            .forEach(tx => {
                const client = tx.added_by_name || tx.user_name || tx.client_name || 'Unknown'; // adaptează la ce ai
                incomeMap[client] = (incomeMap[client] || 0) + Number(tx.amount);
            });

        // Sort and get top 5
        topClientsByIncome.push(
            ...Object.entries(incomeMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, amount]) => ({ name, amount }))
        );
    }



    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">👋 Hello, {user?.name}!</h2>

            {/* Dropdown for accountants to choose a business */}
            {user.role === 'accountant' && accountantBusinesses.length > 0 && (
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Select Business</label>
                    <select
                        value={selectedBusinessId}
                        onChange={(e) => {
                            setSelectedBusinessId(e.target.value);
                            fetchTransactions();
                        }}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">-- Choose Business --</option>
                        {accountantBusinesses.map((biz) => (
                            <option key={biz.business_id} value={biz.business_id}>
                                {biz.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Business name heading */}
            {selectedBusinessId && selectedBusinessName && (
                <h3 className="text-lg font-semibold text-gray-700 mb-6">
                    Dashboard for <span className="text-indigo-600">{selectedBusinessName}</span>
                </h3>
            )}
            <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Month Filter */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Filter by Month</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {format(new Date(2000, i, 1), 'MMMM')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Business Filter (visible only to accountant/administrator) */}
                {(user.role === 'accountant' || user.role === 'administrator') && (
                    <div>
                        <label className="block mb-1 text-sm font-medium">Filter by Business</label>
                        <select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">All</option>
                            {accountantBusinesses.map((biz) => (
                                <option key={biz.business_id} value={biz.business_id}>
                                    {biz.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Category Filter */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Filter by Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">All</option>
                        {[...new Set(transactions.map(tx => tx.category))].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>


            {/* Pie Chart: Spending Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">Spending Breakdown</h3>

                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) =>
                            `${new Intl.NumberFormat('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }).format(value)} RON`
                        } />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Income vs. Spend */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">Income vs. Expense</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-100 p-4 rounded shadow">
                        <p className="text-sm text-green-700">Total Income</p>
                        <p className="text-xl font-bold text-green-900">{totalIncome.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON</p>
                    </div>
                    <div className="bg-red-100 p-4 rounded shadow">
                        <p className="text-sm text-red-700">Total Expenses</p>
                        <p className="text-xl font-bold text-red-900">{totalExpenses.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON</p>
                    </div>
                    <div className={`p-4 rounded shadow ${profit >= 0 ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                        <p className="text-sm">{profit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
                        <p className="text-xl font-bold">{profit.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON RON</p>
                    </div>
                </div>



                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incomeVsExpensesData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        />

                        <Legend />
                        <Bar dataKey="income" fill="#4ade80" name="Income" />
                        <Bar dataKey="expenses" fill="#f87171" name="Expenses" />
                    </BarChart>
                </ResponsiveContainer>

            </div>

            {topClientsByIncome.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Top 5 Clients by Income
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topClientsByIncome.map((client, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm hover:shadow-md transition duration-300"
                            >
                                <div className="text-sm text-gray-500 mb-1">#{index + 1}</div>
                                <div className="font-semibold text-base mb-1">{client.name}</div>
                                <div className="text-green-700 font-bold text-lg">
                                    {client.amount.toLocaleString('ro-RO', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })} RON
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Line Chart: Daily Spending */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">Spending Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySpendingData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) =>
                            `${new Intl.NumberFormat('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }).format(value)} RON`
                        } />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Bar Chart: Monthly Category Spending */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">📊 Monthly Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyCategoryData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) =>
                            `${new Intl.NumberFormat('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }).format(value)} RON`
                        } />
                        <Legend />
                        <Bar dataKey="Groceries" stackId="a" fill="#4f46e5" />
                        <Bar dataKey="Transport" stackId="a" fill="#10b981" />
                        <Bar dataKey="Entertainment" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="Rent" stackId="a" fill="#ef4444" />
                        <Bar dataKey="Utilities" stackId="a" fill="#6366f1" />
                        <Bar dataKey="Other" stackId="a" fill="#ec4899" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Button to view deeper AI insights */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/dashboard/insights')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow transition duration-200"
                >
                    <span>🔍</span>
                    <span>See Insights</span>
                </button>
            </div>

            {/* Smart Suggestions for Admins only */}
            {user.role === 'administrator' && (
                <SmartBudgetSuggestions transactions={transactions} />
            )}
        </div>
    );
};

export default AccountHome;
