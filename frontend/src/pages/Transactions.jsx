// ⬇️ Paste this in your Transactions.jsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        amount: '',
        category: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0],
        business_id: ''
    });
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [accountantBusinesses, setAccountantBusinesses] = useState([]);
    const [toastMessage, setToastMessage] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [startMonth, setStartMonth] = useState('');
    const [endMonth, setEndMonth] = useState('');
    const [exportWarning, setExportWarning] = useState('');

    useEffect(() => {
        fetchTransactions();
        if (user?.role === 'accountant') {
            fetch(`http://localhost:5000/api/accountants/${user.user_id}`)
                .then(res => res.json())
                .then(data => setAccountantBusinesses(data));
        }
    }, []);


    const fetchTransactions = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/transactions?user_id=${user.user_id}`);
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const triggerToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleSaveTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.category) {
            triggerToast('Please fill out all fields!');
            return;
        }

        const payload = {
            ...newTransaction,
            user_id: user.user_id,
            added_by: user.role,
            business_id: user.role === 'accountant' ? newTransaction.business_id : user.business_id
        };

        try {
            const res = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                triggerToast('Transaction added!');
                setIsModalOpen(false);
                setNewTransaction({
                    amount: '', category: '', note: '',
                    transaction_date: new Date().toISOString().split('T')[0], business_id: ''
                });
                fetchTransactions();
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };

    const handleExport = () => {
        window.open('http://localhost:5000/api/transactions/export', '_blank');
    };

    const getEndDate = (yearMonth) => {
        if (!yearMonth || !yearMonth.includes('-')) return null;

        const [year, month] = yearMonth.split('-').map(Number);
        const lastDay = new Date(year, month, 0);
        return lastDay.toISOString().split('T')[0];
    };

    return (
        <div className="bg-white p-6 rounded shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Transactions</h2>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Add Transaction
                </button>
            </div>

            {toastMessage && <div className="mb-4 text-green-600 font-medium">{toastMessage}</div>}

            {transactions.length === 0 ? (
                <p className="text-gray-500">No transactions yet.</p>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <div key={tx.transaction_id} className="p-4 bg-gray-100 rounded-md shadow">
                            <div className="flex justify-between">
                                <div>
                                    <h4 className="font-semibold">{tx.category}</h4>
                                    <p className="text-sm text-gray-600">{tx.note || 'No note'}</p>
                                    <p className="text-xs text-gray-500">
                                        Added by {tx.added_by}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600">{parseFloat(tx.amount).toFixed(2)} RON</p>
                                    <p className="text-xs text-gray-500">{format(new Date(tx.transaction_date), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6">
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Export Transactions
                </button>
            </div>


            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center relative">
                        <h3 className="text-lg font-semibold mb-4">Choose export format</h3>

                        <div className="mb-4 text-left">
                            <label className="block mb-1 font-medium">Start Month</label>
                            <input
                                type="month"
                                value={startMonth}
                                onChange={(e) => setStartMonth(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="mb-4 text-left">
                            <label className="block mb-1 font-medium">End Month</label>
                            <input
                                type="month"
                                value={endMonth}
                                onChange={(e) => setEndMonth(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>


                        {startMonth && endMonth && new Date(startMonth) <= new Date(endMonth) && (
                            <div className="flex gap-4 justify-center mb-4">
                                <a
                                    href={`http://localhost:5000/api/transactions/export?format=excel&start=${startMonth}-01&end=${getEndDate(endMonth)}`}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Excel
                                </a>
                                <a
                                    href={`http://localhost:5000/api/transactions/export?format=pdf&start=${startMonth}-01&end=${getEndDate(endMonth)}`}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                                >
                                    PDF
                                </a>
                            </div>
                        )}


                        <button
                            onClick={() => setIsExportModalOpen(false)}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}


            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
                        <h3 className="text-xl font-bold mb-4">Add Transaction</h3>
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-full mb-2 p-2 border rounded"
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                        />
                        <select
                            className="w-full mb-2 p-2 border rounded"
                            value={newTransaction.category}
                            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Rent">Rent</option>
                            <option value="Transport">Transport</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Other">Other</option>
                        </select>
                        <DatePicker
                            selected={new Date(newTransaction.transaction_date)}
                            onChange={(date) => setNewTransaction({
                                ...newTransaction,
                                transaction_date: date.toISOString().split('T')[0],
                            })}
                            className="w-full mb-2 p-2 border rounded"
                            dateFormat="dd MMM yyyy"
                        />
                        <textarea
                            placeholder="Note (optional)"
                            className="w-full mb-4 p-2 border rounded"
                            value={newTransaction.note}
                            onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
                        />
                        {user.role === 'accountant' && (
                            <select
                                className="w-full mb-4 p-2 border rounded"
                                value={newTransaction.business_id}
                                onChange={(e) => setNewTransaction({ ...newTransaction, business_id: e.target.value })}
                            >
                                <option value="">Select Business</option>
                                {accountantBusinesses.map(biz => (
                                    <option key={biz.business_id} value={biz.business_id}>
                                        {biz.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={handleSaveTransaction} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                        </div>
                        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl" onClick={() => setIsModalOpen(false)}>
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
