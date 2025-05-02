import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

const AccountHome = ({ user }) => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        // Fetch transactions from backend here if needed
    }, []);

    const chartData = transactions.map(tx => ({
        name: tx.category,
        value: tx.amount,
    }));

    const dailySpendingData = transactions.map(tx => ({
        date: tx.transaction_date,
        amount: tx.amount,
    }));

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
            <div className="bg-white p-6 rounded-xl shadow-md">
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
        </div>
    );
};

export default AccountHome;