import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

// Default budget categories grouped by type
const DEFAULT_CATEGORIES = {
    needs: [
        { key: 'medical', name: 'Medical' },
        { key: 'subscriptions', name: 'Subscriptions' },
        { key: 'transport', name: 'Transport' },
        { key: 'groceries', name: 'Groceries' },
        { key: 'rent', name: 'Rent' }
    ],
    wants: [
        { key: 'activities', name: 'Activities' },
        { key: 'shopping', name: 'Shopping' },
        { key: 'beauty', name: 'Beauty' },
        { key: 'gifts', name: 'Gifts' },
        { key: 'travel', name: 'Travel' }
    ],
    savings: [
        { key: 'emergency', name: 'Emergency Fund' },
        { key: 'investments', name: 'Investments' }
    ]
};

const EmployeeHome = ({ user, transactions = [] }) => {
    console.log("Transactions received in props:", transactions);

    // State for salary, savings goal, categories, expenses, edit mode, and tips
    const [salary, setSalary] = useState('');
    const [goal, setGoal] = useState('');
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [spending, setSpending] = useState({});
    const [tips, setTips] = useState([]);
    const [behavior, setBehavior] = useState(null);
    const [showInsights, setShowInsights] = useState(false);
    const [categoryPredictions, setCategoryPredictions] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [targets, setTargets] = useState({});
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        const fetchSalary = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('[DEBUG] token =', token);

                if (!token) {
                    console.warn('⚠️ No token found. Skipping fetch.');
                    return;
                }

                const res = await fetch(`http://localhost:5000/api/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                console.log('[DEBUG] response data =', data);

                if (data.salary) setSalary(data.salary);
            } catch (err) {
                console.error('Failed to fetch salary:', err);
            }
        };

        fetchSalary();
    }, []);

    useEffect(() => {
        const fetchBehavior = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                // Fetch user transactions
                const res = await fetch(`http://localhost:5000/api/transactions`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (!res.ok || !Array.isArray(data)) {
                    console.error('Failed to fetch transactions');
                    return;
                }

                // Send to ML behavior endpoint
                const behaviorRes = await fetch(`http://localhost:5000/api/transactions/ml-behavior`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                });

                const behaviorData = await behaviorRes.json();
                setBehavior(behaviorData);
            } catch (err) {
                console.error('Failed to fetch financial behavior:', err);
            }
        };
        fetchBehavior();
    }, []);

    useEffect(() => {
        const savedGoal = localStorage.getItem('savingsGoal');
        const savedTargets = localStorage.getItem('categoryTargets');
        if (savedGoal) setGoal(savedGoal);
        if (savedTargets) setTargets(JSON.parse(savedTargets));
    }, []);

    useEffect(() => {
        localStorage.setItem('savingsGoal', goal);
    }, [goal]);

    useEffect(() => {
        console.log("[DEBUG] TARGETS LOADED:", targets);
        localStorage.setItem('categoryTargets', JSON.stringify(targets));
    }, [targets]);

    useEffect(() => {
        const fetchTargets = async () => {
            if (!selectedMonth) return;

            try {
                const response = await fetch(`http://localhost:5000/api/targets?month=${selectedMonth}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                console.log("[DEBUG] TARGETS LOADED:", data);
                setTargets(data);
            } catch (error) {
                console.error("Failed to fetch targets:", error);
            }
        };


        fetchTargets();
    }, [selectedMonth]);

    const fetchUserInsights = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('http://localhost:5000/api/transactions', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!Array.isArray(data)) return;

            // Predict per category
            const predRes = await fetch('http://localhost:5000/api/transactions/ml-predict-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            const predictions = await predRes.json();
            setCategoryPredictions(predictions);

            // Pattern detection
            const patRes = await fetch('http://localhost:5000/api/transactions/ml-patterns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            const patterns = await patRes.json();
            setPatterns(patterns);

            setShowInsights(true);
        } catch (err) {
            console.error('Error fetching insights:', err);
        }
    };

    // Update spending values manually
    const handleSpendingChange = (key, value) => {
        setSpending(prev => ({ ...prev, [key]: Number(value) }));
    };


    // Basic budget calculations using the 50/30/20 rule
    const savingsAmount = Number(goal);
    const available = Number(salary) - savingsAmount;
    const needsBudget = available * 0.5;
    const wantsBudget = available * 0.3;

    // Sum total expenses per category group
    const totalByGroup = (group) =>
        categories[group].reduce((sum, cat) => sum + (spending[cat.key] || 0), 0);

    // Generate personalized financial tips based on current values
    const checkTips = () => {
        const newTips = [];
        if (salary && goal) {
            if (totalByGroup('needs') > needsBudget)
                newTips.push('⚠️ You exceeded your Needs budget. Consider adjusting subscriptions or rent.');
            if (totalByGroup('wants') > wantsBudget)
                newTips.push('⚠️ Your Wants exceed 30%. Try reducing shopping or entertainment.');
            if (savingsAmount < salary * 0.2)
                newTips.push('💡 Aim to save at least 20% of your salary.');
            if (salary - totalByGroup('needs') - totalByGroup('wants') - savingsAmount < 0)
                newTips.push('⚠️ Total spending exceeds salary. Reduce some categories.');
        } else {
            newTips.push('ℹ️ Please enter your salary and savings goal to receive tips.');
        }
        setTips(newTips);
    };

    // Data for bar chart showing breakdown
    const breakdownChart = [
        { name: 'Needs', value: totalByGroup('needs') },
        { name: 'Wants', value: totalByGroup('wants') },
        { name: 'Savings', value: savingsAmount },
        { name: 'Left Over', value: salary - totalByGroup('needs') - totalByGroup('wants') - savingsAmount }
    ];

    // Generate equal distribution suggestions for each category group
    const getSuggestion = (groupBudget, groupList) => {
        const equalSplit = groupBudget / groupList.length;
        return groupList.reduce((acc, cat) => {
            acc[cat.key] = equalSplit.toFixed(0);
            return acc;
        }, {});
    };

    // Combine suggestions across all groups
    const suggestions = {
        ...getSuggestion(needsBudget, categories.needs),
        ...getSuggestion(wantsBudget, categories.wants),
        ...getSuggestion(savingsAmount, categories.savings)
    };

    const handleTargetChange = async (key, value) => {
        const updatedTargets = { ...targets, [key]: value };
        setTargets(updatedTargets);

        try {
            const response = await fetch('http://localhost:5000/api/targets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    category: key,
                    target_amount: parseFloat(value),
                    month: selectedMonth,
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.error("Failed to save target:", error);
        }
    };




    const getActualSpend = (categoryKey) => {
        return transactions
            .filter(tx => {
                const txMonth = new Date(tx.transaction_date).toISOString().slice(0, 7);
                return (
                    tx.category?.toLowerCase() === categoryKey.toLowerCase() &&
                    !tx.is_business_expense &&
                    (!selectedMonth || txMonth === selectedMonth)
                );
            })
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
    };




    const uniqueMonths = [...new Set(transactions.map(tx =>
        new Date(tx.transaction_date).toISOString().slice(0, 7)
    ))].sort().reverse();





    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">👋 Hello, {user?.name}!</h2>
            <h2 className="text-2xl font-bold mb-4">📊 Personal Budget Overview</h2>

            {/* Salary input (read-only) */}
            <div className="mb-4">
                <label className="block font-medium mb-1">Monthly Salary (RON)</label>
                <input
                    type="number"
                    value={salary}
                    readOnly
                    className="border p-2 rounded w-full max-w-md bg-gray-100 text-gray-600"
                />
                {!salary && <p className="text-sm text-gray-500">Salary not set by administrator yet.</p>}
            </div>


            {/* Savings goal input */}
            <div className="mb-4">
                <label className="block font-medium mb-1">Savings Goal (RON)</label>
                <input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="border p-2 rounded w-full max-w-md"
                />
            </div>

            <div className="mb-4">
                <label className="block font-medium mb-1">Select Month</label>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border p-2 rounded w-full max-w-md"
                >
                    <option value="">All</option>
                    {uniqueMonths.map((month, idx) => (
                        <option key={idx} value={month}>{month}</option>
                    ))}
                </select>
            </div>

            {/* Financial Behavior */}
            <div className="mb-4">
                <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-200">
                    <h3 className="text-xl font-semibold mb-3">🧠 Financial Behavior</h3>
                    {behavior ? (
                        <>
                            <p className="text-lg font-bold text-indigo-800">{behavior.behavior}</p>
                            <p className="text-gray-700">{behavior.description}</p>
                        </>
                    ) : (
                        <p className="text-gray-500">Analyzing your financial behavior...</p>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <button
                    onClick={fetchUserInsights}
                    className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    🔎 Show Smart Insights
                </button>
            </div>

            {showInsights && (
                <div className="space-y-6">
                    {/* Prediction per Category */}
                    <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                        <h3 className="text-xl font-semibold mb-3">📈 Category Forecasts</h3>
                        {categoryPredictions.length > 0 ? (
                            <ul className="space-y-2 text-gray-700">
                                {categoryPredictions.map((item, idx) => (
                                    <li key={idx} className="flex justify-between">
                                        <span>{item.category}</span>
                                        <span>{item.next_month.toFixed(2)} RON ({item.change})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No predictions available.</p>
                        )}
                    </div>

                    {/* Pattern Detection */}
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
                        <h3 className="text-xl font-semibold mb-3">📅 Spending Patterns</h3>
                        <ul className="list-disc pl-6 text-gray-700 space-y-1">
                            {patterns.map((item, idx) => (
                                <li key={idx}>
                                    <strong>{item.month}</strong>: {item.top_category} – {item.total.toLocaleString()} RON
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            )}

            {/* Budget breakdown chart */}
            <div className="bg-white p-6 rounded shadow mb-6">
                <h3 className="text-lg font-semibold mb-2">🧠 Budget Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={breakdownChart}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1">
                            <LabelList dataKey="value" position="top" fill="#111827" fontSize={14} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Button to trigg er financial tips */}
            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    onClick={checkTips}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    💡 Show Saving Tips
                </button>


                {/* Display generated tips */}
                {tips.length > 0 && (
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-lg font-semibold mb-2">🔔 Personalized Alerts</h3>
                        <ul className="list-disc pl-6 text-gray-800">
                            {tips.map((t, idx) => <li key={idx}>{t}</li>)}
                        </ul>
                    </div>
                )}


            </div>

            {
                ['needs', 'wants', 'savings'].map(group => (
                    <div key={group} className="mb-6 bg-white p-6 rounded shadow">
                        <h3 className="text-lg font-semibold mb-2">
                            {group.charAt(0).toUpperCase() + group.slice(1)}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {categories[group].map((cat, idx) => {
                                const actual = getActualSpend(cat.key);
                                const target = targets[cat.key] || 0;
                                const diff = actual - target;
                                const status = diff > 0 ? `⚠️ Over by ${diff.toFixed(2)} RON`
                                    : diff === 0 ? `✅ On target`
                                        : `✅ Under by ${Math.abs(diff).toFixed(2)} RON`;

                                return (
                                    <div key={cat.key} className="border p-4 rounded shadow bg-gray-50">
                                        <h4 className="font-medium mb-2">{cat.name}</h4>

                                        {/* Target input */}
                                        <label className="text-sm text-gray-600">Target (RON):</label>
                                        <input
                                            type="number"
                                            value={targets[cat.key.toLowerCase()] || ''}
                                            onChange={(e) => handleTargetChange(cat.key, e.target.value)}
                                            className="border p-2 rounded w-full mb-2"
                                        />

                                        {/* Actual spend */}
                                        <p className="text-sm text-gray-600">Actual: {actual.toFixed(2)} RON</p>
                                        <p className={`text-sm font-semibold ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {status}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            }
        </div >
    );
};

export default EmployeeHome;
