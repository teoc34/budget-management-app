// AccountantDashboard.jsx
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const AccountantDashboard = ({ user }) => {
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [businesses, setBusinesses] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [businessDetails, setBusinessDetails] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

    useEffect(() => {
        fetch(`http://localhost:5000/api/accountants/${user.user_id}`)
            .then(res => res.json())
            .then(setBusinesses)
            .catch(console.error);
    }, [user.user_id]);

    useEffect(() => {
        if (!selectedBusinessId) return;

        // Fetch business details from the new endpoint
        fetch(`http://localhost:5000/api/businesses/${selectedBusinessId}`)
            .then(res => res.json())
            .then(setBusinessDetails)
            .catch(console.error);

        // Fetch transactions for selected business
        fetch(`http://localhost:5000/api/transactions?business_id=${selectedBusinessId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTransactions(data);
                } else {
                    console.error('Unexpected transaction data:', data);
                    setTransactions([]);
                }
            })
            .catch(console.error);
    }, [selectedBusinessId]);

    const filteredTransactions = selectedMonth
        ? transactions.filter(tx => new Date(tx.transaction_date).getMonth() + 1 === Number(selectedMonth))
        : transactions;

    const income = filteredTransactions.filter(tx => tx.transaction_type === 'income');
    const expense = filteredTransactions.filter(tx => tx.transaction_type === 'expense');

    const totalIncome = income.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalExpense = expense.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const netProfit = totalIncome - totalExpense;

    const expensesByCategory = expense.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount);
        return acc;
    }, {});

    const pieData = Object.entries(expensesByCategory).map(([cat, val]) => ({ name: cat, value: val }));

    const FIXED_CATEGORIES = ['Rent', 'Utilities'];
    const VARIABLE_CATEGORIES = ['Transport', 'Entertainment', 'Office Supplies', 'Medical', 'Other'];

    const fixedExpense = expense
        .filter(tx => FIXED_CATEGORIES.includes(tx.category))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const variableExpense = expense
        .filter(tx => VARIABLE_CATEGORIES.includes(tx.category))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    return (
        <div className="p-6 space-y-10">
            <h2 className="text-2xl font-bold">📊 Accountant Dashboard</h2>

            {/* Select Business */}
            <div className="mb-4">
                <label className="block text-sm font-medium">Select Business</label>
                <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)} className="border p-2 rounded">
                    <option value="">-- Select --</option>
                    {businesses.map(b => (
                        <option key={b.business_id} value={b.business_id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {businessDetails && (
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-semibold mb-4">🏢 General Business Information</h3>
                    <p><strong>Name:</strong> {businessDetails.name}</p>
                    <p><strong>CUI / CIF:</strong> {businessDetails.cui}</p>
                    <p><strong>VAT Status:</strong> {businessDetails.vat_status}</p>
                    <p><strong>Registration Date:</strong> {format(new Date(businessDetails.registration_date), 'dd MMM yyyy')}</p>
                    <p><strong>Company Type:</strong> {businessDetails.company_type}</p>
                </div>
            )}

            {/* Income / Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-100 p-4 rounded shadow">
                    <p className="text-sm text-green-700">Total Income</p>
                    <p className="text-xl font-bold text-green-900">{totalIncome.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                </div>
                <div className="bg-red-100 p-4 rounded shadow">
                    <p className="text-sm text-red-700">Total Expenses</p>
                    <p className="text-xl font-bold text-red-900">{totalExpense.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                </div>
                <div className={`p-4 rounded shadow ${netProfit >= 0 ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                    <p className="text-sm">{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
                    <p className="text-xl font-bold">{netProfit.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                </div>
            </div>

            {/* Month Filter */}
            <div className="mt-4">
                <label className="block text-sm font-medium">Filter by Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border p-2 rounded">
                    <option value="">All</option>
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{format(new Date(2025, i, 1), 'MMMM')}</option>
                    ))}
                </select>
            </div>

            {/* Expense Structure Pie Chart */}
            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">Expense Structure</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Coming Next Sections Placeholder */}
            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">🧮 Key Accounting Indicators</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Profitability Ratio:</strong> {(totalIncome > 0 ? (netProfit / totalIncome * 100).toFixed(2) : 'N/A')}%</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Gross Margin Ratio:</strong> {(totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 'N/A')}%</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Fixed vs Variable Expenses Ratio:</strong> {(variableExpense > 0 ? (fixedExpense / variableExpense).toFixed(2) : 'N/A')}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Net Cash Flow:</strong> {netProfit.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Account Balance:</strong> {(totalIncome - totalExpense).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">📄 VAT Situation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Collected VAT:</strong> {(income.reduce((sum, tx) => sum + Number(tx.vat_amount || 0), 0)).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Deductible VAT:</strong> {(expense.reduce((sum, tx) => sum + Number(tx.vat_amount || 0), 0)).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>VAT Payable / Recoverable:</strong> {((income.reduce((sum, tx) => sum + Number(tx.vat_amount || 0), 0)) - (expense.reduce((sum, tx) => sum + Number(tx.vat_amount || 0), 0))).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded">
                        <p><strong>Next D300 Submission:</strong> 25 {format(new Date(), 'MMMM yyyy')}</p>
                        <p className="text-xs text-gray-500 mt-1">(Alert: Submit before this date)</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">📅 Payment Schedule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Unpaid Issued Invoices:</strong> {
                            transactions.filter(tx => tx.transaction_type === 'income' && tx.status === 'unpaid').length
                        }</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Unpaid Received Invoices:</strong> {
                            transactions.filter(tx => tx.transaction_type === 'expense' && tx.status === 'unpaid').length
                        }</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>On-Time Invoices:</strong> {
                            transactions.filter(tx => tx.due_date && new Date(tx.due_date) >= new Date()).length
                        }</p>
                    </div>
                    <div className="bg-orange-100 p-4 rounded">
                        <p><strong>Overdue Invoices:</strong> {
                            transactions.filter(tx => tx.due_date && new Date(tx.due_date) < new Date()).length
                        }</p>
                        <p className="text-xs text-gray-500 mt-1">(Check for follow-up)</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">📝 Declarations & Fiscal Obligations</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Submission Status (D112):</strong> Submitted</p>
                        <p><strong>Submission Status (D300):</strong> Submitted</p>
                        <p><strong>Submission Status (D394):</strong> Pending</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded">
                        <p><strong>Upcoming Deadlines:</strong></p>
                        <ul className="list-disc list-inside text-xs mt-1">
                            <li>D112 – 15 {format(new Date(), 'MMMM yyyy')}</li>
                            <li>D300 – 25 {format(new Date(), 'MMMM yyyy')}</li>
                            <li>D394 – 30 {format(new Date(), 'MMMM yyyy')}</li>
                        </ul>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Current Obligations:</strong></p>
                        <ul className="list-disc list-inside text-xs mt-1">
                            <li>Income tax: {(netProfit * 0.1).toFixed(2)} RON</li>
                            <li>Social contributions: {(netProfit * 0.25).toFixed(2)} RON</li>
                            <li>Health insurance: {(netProfit * 0.10).toFixed(2)} RON</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">👥 Employees & Payroll</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Active Employees:</strong> {businessDetails?.active_employees || 'N/A'}</p>
                        <p><strong>Turnover Rate:</strong> {businessDetails?.turnover_rate ? `${businessDetails.turnover_rate}%` : 'N/A'}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Total Gross Salaries:</strong> {
                            transactions
                                .filter(tx => tx.transaction_type === 'expense' && tx.category === 'Salaries')
                                .reduce((sum, tx) => sum + Number(tx.amount), 0)
                                .toLocaleString('ro-RO', { minimumFractionDigits: 2 })
                        } RON</p>
                        <p><strong>Estimated Contributions:</strong> {
                            (transactions
                                .filter(tx => tx.transaction_type === 'expense' && tx.category === 'Salaries')
                                .reduce((sum, tx) => sum + Number(tx.amount), 0) * 0.25).toLocaleString('ro-RO', { minimumFractionDigits: 2 })
                        } RON</p>
                        <p><strong>Estimated Salary Tax:</strong> {
                            (transactions
                                .filter(tx => tx.transaction_type === 'expense' && tx.category === 'Salaries')
                                .reduce((sum, tx) => sum + Number(tx.amount), 0) * 0.10).toLocaleString('ro-RO', { minimumFractionDigits: 2 })
                        } RON</p>
                    </div>
                    <div className="col-span-2 bg-white rounded p-4">
                        <h5 className="font-semibold mb-2">Monthly Payroll Chart (Placeholder)</h5>
                        <p className="text-xs text-gray-500">(To be implemented with bar chart using monthly salary expenses)</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h4 className="text-md font-semibold mb-4">📊 Company Comparison</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Top Companies by Profit:</strong></p>
                        <p className="text-xs text-gray-600">(To be fetched and ranked from multiple businesses)</p>
                    </div>
                    <div className="bg-orange-100 p-4 rounded">
                        <p><strong>Companies with Losses / Fiscal Risk:</strong></p>
                        <p className="text-xs text-gray-600">(To be determined based on net loss or overdue invoices)</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Debt Collection Rate:</strong></p>
                        <p className="text-xs text-gray-600">(e.g., Paid Invoices / Total Issued Invoices)</p>
                    </div>
                    <div className="bg-white p-4 rounded">
                        <p><strong>Monthly Expense Trends:</strong></p>
                        <p className="text-xs text-gray-600">(To be displayed with line chart – Recharts)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountantDashboard;
