import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const Insights = ({ user, selectedBusinessId }) => {
    const [insights, setInsights] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [forecast, setForecast] = useState('0.00');
    const [anomalies, setAnomalies] = useState([]);

    const [kpis, setKpis] = useState({
        total: '0.00',
        count: 0,
        avg: '0.00',
        top: [],
    });

    const formatNumber = (num) =>
        Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

            // KPI calc
            let total = 0;
            const totalByCategory = {};
            const monthlyExpenses = {};

            data.forEach(tx => {
                const amt = parseFloat(tx.amount);
                total += amt;

                const cat = tx.category;
                totalByCategory[cat] = (totalByCategory[cat] || 0) + amt;

                if (tx.transaction_type === 'expense') {
                    const month = format(new Date(tx.transaction_date), 'yyyy-MM');
                    monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amt;
                }
            });

            const topCategories = Object.entries(totalByCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([cat, val]) => ({ category: cat, amount: formatNumber(val) }));

            const avgPerTransaction = formatNumber(total / data.length);

            setKpis({
                total: formatNumber(total),
                count: data.length,
                avg: avgPerTransaction,
                top: topCategories,
            });

            // Forecast calc
            const lastThree = Object.entries(monthlyExpenses)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .slice(-3)
                .map(([_, val]) => val);

            const avgForecast = lastThree.length > 0
                ? lastThree.reduce((sum, val) => sum + val, 0) / lastThree.length
                : 0;

            setForecast(avgForecast.toFixed(2));

            // ML
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

            const anomaliesRes = await fetch('http://localhost:5000/api/transactions/ml-anomalies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });
            const anomaliesData = await anomaliesRes.json();
            setAnomalies(anomaliesData);

        };

        fetchAndAnalyze();
    }, [user, selectedBusinessId]);

    // Category trends
    const getMonthlyTrends = () => {
        const monthlyData = {};
        transactions.forEach(tx => {
            const month = format(new Date(tx.transaction_date), 'yyyy-MM');
            const cat = tx.category;
            if (!monthlyData[cat]) monthlyData[cat] = {};
            monthlyData[cat][month] = (monthlyData[cat][month] || 0) + parseFloat(tx.amount);
        });

        return Object.entries(monthlyData).map(([category, monthsObj]) => {
            const sorted = Object.entries(monthsObj).sort(([a], [b]) => new Date(a) - new Date(b));
            const lastTwo = sorted.slice(-2);
            const trend = lastTwo.length === 2 ? lastTwo[1][1] - lastTwo[0][1] : 0;
            const direction = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
            return { category, trend: direction };
        }).slice(0, 3);
    };

    const trends = getMonthlyTrends();



    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-6 shadow rounded-xl space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">💡 Machine Learning Insights</h2>

            {/* KPI Section */}
            <div className="bg-gray-100 p-5 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">📌 Key Performance Indicators</h3>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="bg-yellow-100 p-4 rounded shadow">
                        <p className="text-sm text-yellow-800">Total Spend</p>
                        <p className="text-xl font-bold text-yellow-900">{kpis.total} RON</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded shadow">
                        <p className="text-sm text-blue-800">Number of Transactions</p>
                        <p className="text-xl font-bold text-blue-900">{kpis.count}</p>
                    </div>
                    <div className="bg-purple-100 p-4 rounded shadow">
                        <p className="text-sm text-purple-800">Average per Transaction</p>
                        <p className="text-xl font-bold text-purple-900">{kpis.avg} RON</p>
                    </div>
                </div>

                <div className="mt-2">
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Top Categories</h4>
                    <ul className="text-left text-gray-800 space-y-1">
                        {kpis.top.map((cat, idx) => (
                            <li key={idx} className="flex justify-between border-b pb-1">
                                <span>{cat.category}</span>
                                <span className="font-semibold">{cat.amount} RON</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Forecast Section */}
            <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                <h3 className="text-xl font-semibold mb-3">📈 Forecasted Spending (Next Month)</h3>
                <p className="text-lg text-yellow-800">
                    Estimated total expenses: <strong>{forecast} RON</strong>
                </p>
            </div>

            {/* ML Predictions */}
            <div className="bg-gray-50 p-5 rounded-lg border border-yellow-100">
                <h3 className="text-xl font-semibold mb-3">🧠 Overspending Predictions</h3>
                {insights.length > 0 ? (
                    <ul className="space-y-2 text-gray-700">
                        {insights
                            .filter(item => item.category.toLowerCase() !== 'income')
                            .map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    ⚠️ <span>You might be overspending on <strong>{item.category}</strong>: <span className="text-red-600 font-bold">{item.amount.toFixed(2)} RON</span></span>
                                </li>
                            ))}

                    </ul>
                ) : (
                    <p className="text-gray-500">✅ No significant overspending detected.</p>
                )}
            </div>

            {/* Category Trends */}
            <div className="bg-gray-50 p-5 rounded-lg border border-blue-100">
                <h3 className="text-xl font-semibold mb-3">📊 Top Categories with Trend</h3>
                <ul className="divide-y divide-gray-200">
                    {trends.map(item => (
                        <li key={item.category} className="flex justify-between py-2 text-gray-700">
                            <span>{item.category}</span>
                            <span className={`text-xl ${item.trend === '↑' ? 'text-green-600 animate-bounce' : item.trend === '↓' ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>{item.trend}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Anomalies Detection */}
            <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h3 className="text-xl font-semibold mb-3">🔍 Suspicious Transactions</h3>
                {anomalies.length > 0 ? (
                    <ul className="space-y-2 text-gray-700">
                        {anomalies.map((item, idx) => (
                            <li key={idx} className="flex flex-col sm:flex-row sm:justify-between">
                                <span>{item.category} – {item.amount.toFixed(2)} RON</span>
                                <span className="text-sm text-gray-500">{format(new Date(item.transaction_date), 'dd MMM yyyy')}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">✅ No suspicious transactions detected.</p>
                )}
            </div>

        </div>
    );
};

export default Insights;
