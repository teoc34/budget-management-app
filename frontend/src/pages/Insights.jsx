import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const Insights = ({ user, selectedBusinessId }) => {
    const [insights, setInsights] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchAndAnalyze = async () => {
            if (user.role === 'accountant' && !selectedBusinessId) return;

            const endpoint = user.role === 'accountant'
                ? `http://localhost:5000/api/transactions?business_id=${selectedBusinessId}`
                : `http://localhost:5000/api/transactions`;

            const res = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await res.json();

            if (!res.ok || !Array.isArray(data)) {
                console.error('Transaction fetch failed:', data);
                return;
            }

            setTransactions(data);

            const mlRes = await fetch('http://localhost:5000/api/transactions/ml-insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });

            const mlData = await mlRes.json();
            setInsights(mlData);
        };

        fetchAndAnalyze();
    }, [user, selectedBusinessId]);


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
        <div className="max-w-2xl mx-auto mt-10 bg-white p-6 shadow rounded-xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                💡 Machine Learning Insights
            </h2>

            <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6 border border-yellow-100">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">🧠 Overspending Predictions</h3>
                {insights.length > 0 ? (
                    <ul className="space-y-2 text-gray-700">
                        {insights.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                ⚠️ <span>You might be overspending on <strong>{item.category}</strong>: <span className="text-red-600 font-bold">{item.amount.toFixed(2)} RON</span></span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">✅ No significant overspending detected.</p>
                )}
            </div>

            <div className="bg-gray-50 p-5 rounded-lg shadow-sm border border-blue-100">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">📊 Top Categories with Trend</h3>
                <ul className="divide-y divide-gray-200">
                    {trends.map(item => (
                        <li key={item.category} className="flex justify-between py-2 text-gray-700">
                            <span>{item.category}</span>
                            <span className={`text-xl ${item.trend === '↑' ? 'text-green-600 animate-bounce' :
                                item.trend === '↓' ? 'text-red-600 animate-pulse' :
                                    'text-gray-500'
                                }`}>
                                {item.trend}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Insights;
