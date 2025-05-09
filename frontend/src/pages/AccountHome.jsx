import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis
} from 'recharts';

const EXCLUDED_CATEGORIES = ['Rent', 'Transport', 'Utilities'];

const AccountHome = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [greedySuggestions, setGreedySuggestions] = useState([]);
    const [goalPaths, setGoalPaths] = useState([]);
    const [savingsTarget, setSavingsTarget] = useState(30);

    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/transactions?user_id=${user.user_id}`);
                const data = await res.json();
                setTransactions(data);
                runGreedyOptimizer(data);
            } catch (err) {
                console.error('Error fetching transactions:', err);
            }
        };

        fetchTransactions();
    }, [user, savingsTarget]);

    const runGreedyOptimizer = (data) => {
        const grouped = {};
        data.forEach(tx => {
            if (!EXCLUDED_CATEGORIES.includes(tx.category)) {
                grouped[tx.category] = (grouped[tx.category] || 0) + parseFloat(tx.amount);
            }
        });

        const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
        const total = sorted.reduce((sum, [, value]) => sum + value, 0);
        const target = total * (savingsTarget / 100);

        let saved = 0;
        const suggestions = [];

        for (const [category, value] of sorted) {
            if (saved >= target) break;
            const cut = Math.min(value, target - saved);
            suggestions.push({ category, cut: cut.toFixed(2) });
            saved += cut;
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
            .map(tx => ({ ...tx, amount: parseFloat(tx.amount) }));

        const solutions = [];
        const path = [];

        const backtrack = (index, currentSum) => {
            if (currentSum >= amount) {
                solutions.push([...path]);
                return;
            }
            for (let i = index; i < optional.length; i++) {
                path.push(optional[i]);
                backtrack(i + 1, currentSum + optional[i].amount);
                path.pop();
            }
        };

        backtrack(0, 0);

        const best = solutions.sort((a, b) =>
            a.reduce((acc, tx) => acc + tx.amount, 0) -
            b.reduce((acc, tx) => acc + tx.amount, 0)
        )[0];

        setGoalPaths(best || []);
    };

    const chartData = transactions.reduce((acc, tx) => {
        const found = acc.find(item => item.name === tx.category);
        if (found) {
            found.value += Number(tx.amount);
        } else {
            acc.push({ name: tx.category, value: Number(tx.amount) });
        }
        return acc;
    }, []);

    const dailySpendingData = transactions.reduce((acc, tx) => {
        const date = tx.transaction_date;
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing.amount += Number(tx.amount);
        } else {
            acc.push({ date, amount: Number(tx.amount) });
        }
        return acc.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, []);

    const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">👋 Hello, {user?.name}!</h2>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">Spending Breakdown</h3>
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

            {/* Greedy Optimizer */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10">
                <h3 className="text-xl font-semibold mb-4">💡 Budget Optimizer (Greedy)</h3>
                <label className="block mb-2 text-gray-700">Select how much you want to save this month:</label>
                <select
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(Number(e.target.value))}
                    className="mb-4 border p-2 rounded"
                >
                    <option value={10}>10%</option>
                    <option value={20}>20%</option>
                    <option value={30}>30%</option>
                    <option value={40}>40%</option>
                </select>
                {greedySuggestions.length > 0 ? (
                    <ul className="list-disc pl-6 text-gray-800">
                        {greedySuggestions.map((item, idx) => (
                            <li key={idx}>
                                Cut <strong>{item.cut} RON</strong> from <strong>{item.category}</strong>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Not enough data to generate suggestions yet.</p>
                )}
            </div>

            {/* Backtracking Goal Planner */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4">🎯 Financial Goal Planner (Backtracking)</h3>
                <p className="mb-2">Select a financial goal:</p>
                <select
                    onChange={(e) => handleGoalSelect(Number(e.target.value))}
                    className="mb-4 border p-2 rounded"
                >
                    <option value="">Choose a goal</option>
                    {financialGoals.map((g, idx) => (
                        <option key={idx} value={g.cost}>{g.label}</option>
                    ))}
                </select>
                {goalPaths.length > 0 ? (
                    <ul className="list-disc pl-6 text-gray-800">
                        {goalPaths.map((tx, idx) => (
                            <li key={idx}>
                                Save <strong>{tx.amount} RON</strong> from <strong>{tx.category}</strong> on {tx.transaction_date}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Select a goal to see possible savings paths.</p>
                )}
            </div>
        </div>
    );
};

export default AccountHome;
