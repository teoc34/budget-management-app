import { useEffect, useState } from 'react';
import { FaLightbulb, FaCut, FaChartLine, FaCalculator, FaInfoCircle } from 'react-icons/fa';

const SmartBudgetSuggestions = ({ transactions }) => {
    const [savingsPercent, setSavingsPercent] = useState(30);
    const [solutions, setSolutions] = useState([]);
    const [forecast, setForecast] = useState(null);
    const [kpis, setKpis] = useState({});

    const formatNumber = (num) => {
        return Number(num).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    useEffect(() => {
        if (!transactions || transactions.length === 0) return;

        const onlyExpenses = transactions.filter(tx => tx.transaction_type !== 'income');
        if (onlyExpenses.length === 0) return;

        const total = onlyExpenses.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
        const target = (savingsPercent / 100) * total;

        // Backtracking Suggestions
        const categories = {};
        onlyExpenses.forEach(tx => {
            const category = tx.category;
            const amount = parseFloat(tx.amount);
            if (!categories[category]) categories[category] = 0;
            categories[category] += amount;
        });


        const optimizable = [
            'Entertainment', 'Office Supplies', 'Transport', 'Other',
            'Client Dinner', 'Marketing', 'Software Licenses', 'Travel'
        ];

        const categoryEntries = Object.entries(categories)
            .filter(([category]) => optimizable.includes(category))
            .map(([category, amount]) => ({
                category,
                amount: parseFloat(amount.toFixed(2))
            }));

        const results = [];

        const backtrack = (index, current, remaining, path) => {
            if (remaining <= target * 0.05 && path.length > 0) {
                results.push([...path]);
                return;
            }
            if (index >= categoryEntries.length || results.length >= 10) return;

            const { category, amount } = categoryEntries[index];
            const maxCut = parseFloat((amount * 0.3).toFixed(2));

            for (let step = 1; step <= 3; step++) {
                const cut = parseFloat(((step * maxCut) / 3).toFixed(2));
                if (cut > remaining) continue;

                path.push({ category, cut, original: amount });
                backtrack(index + 1, current + cut, remaining - cut, path);
                path.pop();
            }

            backtrack(index + 1, current, remaining, path);
        };

        backtrack(0, 0, target, []);
        setSolutions(results);
    }, [transactions, savingsPercent]);



    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaLightbulb className="text-yellow-400" /> Smart Budget Suggestions (Backtracking)
            </h3>
            {/* Dropdown + Suggestions */}
            <label className="block text-sm mb-1">How much would you like to save?</label>
            <select
                className="p-2 border rounded mb-4"
                value={savingsPercent}
                onChange={(e) => setSavingsPercent(parseInt(e.target.value))}
            >
                {[10, 20, 30, 40, 50].map(p => (
                    <option key={p} value={p}>{p}%</option>
                ))}
            </select>

            {solutions.length === 0 ? (
                <p className="text-gray-600">No suggestions available yet.</p>
            ) : (
                <div className="space-y-6">
                    {solutions.map((variant, idx) => (
                        <div key={idx} className="border p-4 rounded bg-gray-50 shadow-sm">
                            <h4 className="font-semibold mb-2">💡 Solution #{idx + 1}</h4>
                            <ul className="space-y-2">
                                {variant.map((sug, i) => (
                                    <li key={i} className="flex justify-between text-sm">
                                        <div>
                                            <p><strong>{sug.category}</strong></p>
                                            <p className="text-gray-500 text-xs">
                                                Suggestion: Reduce discretionary spending by reviewing {sug.category.toLowerCase()} invoices.
                                            </p>
                                        </div>
                                        <span className="text-red-600 font-semibold">
                                            <FaCut className="inline mr-1" /> Cut {formatNumber(sug.cut)} RON
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartBudgetSuggestions;
