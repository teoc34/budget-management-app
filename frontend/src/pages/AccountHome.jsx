import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';


const EXCLUDED_CATEGORIES = ['Rent', 'Transport', 'Utilities'];

const AccountHome = ({ user, selectedBusinessId, setSelectedBusinessId, accountantBusinesses }) => {

    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [greedySuggestions, setGreedySuggestions] = useState([]);
    const [goalPaths, setGoalPaths] = useState([]);
    const [savingsTarget, setSavingsTarget] = useState(30);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedBusinessName, setSelectedBusinessName] = useState('');
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [insights, setInsights] = useState([]);


    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                let endpoint = '';

                if (user.role === 'administrator') {
                    endpoint = `http://localhost:5000/api/transactions?business_id=${user.business_id}`;
                } else if (user.role === 'accountant' && selectedBusinessId) {
                    endpoint = `http://localhost:5000/api/transactions?business_id=${selectedBusinessId}`;
                } else {
                    endpoint = `http://localhost:5000/api/transactions?user_id=${user.user_id}`;
                }


                const res = await fetch(endpoint);
                const data = await res.json();

                setTransactions(data);
                runGreedyOptimizer(data);
            } catch (err) {
                console.error('Error fetching transactions:', err);
            }
        };


        const fetchBusinessName = async () => {
            if (selectedBusinessId) {
                try {
                    const res = await fetch(`http://localhost:5000/api/businesses/${selectedBusinessId}`);
                    const data = await res.json();
                    setSelectedBusinessName(data?.name || '');
                } catch (err) {
                    console.error('Failed to load business name:', err);
                    setSelectedBusinessName('');
                }
            } else {
                setSelectedBusinessName('');
            }
        };

        fetchTransactions();
        fetchBusinessName();
    }, [user, savingsTarget, selectedBusinessId]);

    // Greedy Optimizer with percentage saving target
    const runGreedyOptimizer = (data) => {
        const optionalExpenses = data.filter(tx => !EXCLUDED_CATEGORIES.includes(tx.category));
        const categorySums = {};

        optionalExpenses.forEach(tx => {
            categorySums[tx.category] = (categorySums[tx.category] || 0) + parseFloat(tx.amount);
        });

        const sortedCategories = Object.entries(categorySums).sort((a, b) => b[1] - a[1]);
        const totalOptional = sortedCategories.reduce((sum, [, value]) => sum + value, 0);
        const savingTarget = totalOptional * (savingsTarget / 100);

        let remaining = savingTarget;
        const suggestions = [];

        for (const [category, amount] of sortedCategories) {
            if (remaining <= 0) break;
            const cut = Math.min(amount, remaining);
            suggestions.push({ category, cut: cut.toFixed(2) });
            remaining -= cut;
        }

        setGreedySuggestions(suggestions);
    };

    const financialGoals = [
        { value: 'department', label: 'Open New Department', cost: 10000 },
        { value: 'equipment', label: 'Buy New Equipment', cost: 7000 },
        { value: 'staff', label: 'Hire New Staff', cost: 5000 },
        { value: 'infrastructure', label: 'Upgrade Infrastructure', cost: 8000 },
        { value: 'marketing', label: 'Marketing Campaign', cost: 4000 }
    ];

    const handleGoalSelect = (amount) => {
        const optional = transactions
            .filter(tx => !EXCLUDED_CATEGORIES.includes(tx.category))
            .map(tx => ({ ...tx, amount: parseFloat(tx.amount) }))
            .sort((a, b) => b.amount - a.amount); // try bigger values first for shorter paths

        const resultPaths = [];
        const currentPath = [];

        const backtrack = (index, currentSum) => {
            if (currentSum >= amount) {
                resultPaths.push([...currentPath]);
                return;
            }

            for (let i = index; i < optional.length; i++) {
                currentPath.push(optional[i]);
                backtrack(i + 1, currentSum + optional[i].amount);
                currentPath.pop();
            }
        };

        backtrack(0, 0);

        const bestPath = resultPaths.sort((a, b) =>
            a.reduce((sum, tx) => sum + tx.amount, 0) -
            b.reduce((sum, tx) => sum + tx.amount, 0)
        )[0];

        setGoalPaths(bestPath || []);
    };


    const filteredTransactions = selectedMonth
        ? transactions.filter(tx => {
            const month = new Date(tx.transaction_date).getMonth() + 1;
            return month === Number(selectedMonth);
        })
        : transactions;

    const chartData = filteredTransactions.reduce((acc, tx) => {
        const found = acc.find(item => item.name === tx.category);
        if (found) {
            found.value += Number(tx.amount);
        } else {
            acc.push({ name: tx.category, value: Number(tx.amount) });
        }
        return acc;
    }, []);

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

    const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

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

    const generateInsights = () => {
        const grouped = {};
        transactions.forEach(tx => {
            grouped[tx.category] = (grouped[tx.category] || 0) + parseFloat(tx.amount);
        });

        const sorted = Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2); // Top 2 categories

        const result = sorted.map(([category, amount]) => ({ category, amount }));
        setInsights(result);
        setShowInsightsModal(true);
    };


    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">👋 Hello, {user?.name}!</h2>

            {user?.role === 'accountant' && accountantBusinesses?.length > 0 && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Business:</label>
                    <select
                        value={selectedBusinessId}
                        onChange={(e) => setSelectedBusinessId(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="">Select a business</option>
                        {accountantBusinesses
                            .filter((biz, index, self) =>
                                index === self.findIndex(b => b.business_id === biz.business_id)
                            )
                            .map((biz) => (
                                <option key={`dropdown-${biz.business_id}`} value={biz.business_id}>
                                    {biz.name}
                                </option>
                            ))}

                    </select>

                </div>
            )}

            {selectedBusinessId && selectedBusinessName && (
                <h3 className="text-lg font-semibold text-gray-700 mb-6">
                    Dashboard for <span className="text-indigo-600">{selectedBusinessName}</span>
                </h3>
            )}



            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">Spending Breakdown</h3>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <label className="mr-2 font-medium text-gray-700">Filter by month:</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="p-2 border rounded"
                        >
                            <option value="">All</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {format(new Date(2000, i, 1), 'MMMM')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedMonth && (
                        <button
                            onClick={() => setSelectedMonth('')}
                            className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Line Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">Spending Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySpendingData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">📊 Monthly Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyCategoryData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
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

            <div className="mb-6">
                <button
                    onClick={() => navigate('/dashboard/insights')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow transition duration-200"
                >
                    <span>🔍</span>
                    <span>See Insights</span>
                </button>
            </div>




            {/* Greedy Optimizer */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">💡 Smart Budget Suggestions <span
                    className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded cursor-help"
                    title="Implemented with Greedy logic"
                >
                    ?
                </span></h3>
                <label className="block mb-2 text-gray-700">How much would you like to save from optional expenses?</label>
                <select
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(Number(e.target.value))}
                    className="mb-4 border p-2 rounded"
                >
                    {[10, 20, 30, 40].map(val => (
                        <option key={val} value={val}>{val}%</option>
                    ))}
                </select>
                {greedySuggestions.length > 0 ? (
                    <ul className="list-disc pl-6 text-gray-800">
                        {greedySuggestions.map((item, idx) => (
                            <li key={idx}>
                                ✂️ Cut <strong>{item.cut} RON</strong> from <strong>{item.category}</strong>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Not enough data for smart suggestions.</p>
                )}
            </div>


            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4">🎯 Financial Goal Planner <span
                    className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded cursor-help"
                    title="Implemented with Backtracking logic"
                >
                    ?
                </span></h3>
                <p className="mb-2 text-gray-700">Select a goal and let us build your custom savings roadmap.</p>
                <select
                    onChange={(e) => handleGoalSelect(Number(e.target.value))}
                    className="mb-4 border p-2 rounded"
                >
                    <option value="">Choose a goal</option>
                    {financialGoals.map((g, idx) => (
                        <option key={idx} value={g.cost}>{g.label} – {g.cost} RON</option>
                    ))}
                </select>
                {goalPaths.length > 0 ? (
                    <ul className="list-disc pl-6 text-gray-800">
                        {goalPaths.map((tx, idx) => (
                            <li key={idx}>
                                💰 Save <strong>{tx.amount} RON</strong> from <strong>{tx.category}</strong> on {format(new Date(tx.transaction_date), 'dd MMM yyyy')}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No savings route found yet.</p>
                )}
            </div>
        </div >
    );
};

export default AccountHome;
