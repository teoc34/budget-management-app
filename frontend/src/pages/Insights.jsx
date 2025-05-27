import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const Insights = ({ user }) => {
    const [insights, setInsights] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchAndAnalyze = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/transactions?user_id=${user.user_id}`);
                const txData = await res.json();
                setTransactions(txData);

                const mlRes = await fetch('http://localhost:5000/api/transactions/ml-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactions: txData }),
                });

                const data = await mlRes.json();
                setInsights(data);
            } catch (error) {
                console.error('Error fetching or analyzing data:', error);
            }
        };

        fetchAndAnalyze();
    }, [user]);

    const getMonthlyTrends = (transactions) => {
        const monthlyData = {};

        transactions.forEach(tx => {
            const month = format(new Date(tx.transaction_date), 'yyyy-MM');
            const cat = tx.category;
            if (!monthlyData[cat]) monthlyData[cat] = {};
            monthlyData[cat][month] = (monthlyData[cat][month] || 0) + parseFloat(tx.amount);
        });

        const trendData = Object.entries(monthlyData).map(([category, monthsObj]) => {
            const sortedMonths = Object.entries(monthsObj).sort(([a], [b]) => new Date(a) - new Date(b));
            const lastTwo = sortedMonths.slice(-2);

            const trend = lastTwo.length === 2
                ? lastTwo[1][1] - lastTwo[0][1]
                : 0;

            const direction = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

            const total = Object.values(monthsObj).reduce((sum, val) => sum + val, 0);

            return { category, trend: direction, total };
        });

        return trendData
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
    };

    const trends = getMonthlyTrends(transactions);

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h2 className="text-2xl font-bold mb-6">💡 Machine Learning Insights</h2>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-semibold mb-2">🧠 Overspending Predictions</h3>
                {insights.length > 0 ? (
                    <ul className="list-disc pl-6">
                        {insights.map((item, idx) => (
                            <li key={idx}>
                                ⚠️ You might be overspending on <strong>{item.category}</strong>: {item.amount.toFixed(2)} RON
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No significant overspending detected.</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">📊 Top Categories with Trend</h3>
                <ul className="space-y-2">
                    {trends.map(item => (
                        <li key={item.category} className="flex justify-between">
                            <span>{item.category}</span>
                            <span className="text-xl">{item.trend}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Insights;
