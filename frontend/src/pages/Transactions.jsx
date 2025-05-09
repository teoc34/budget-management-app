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
    });
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        const loadTransactions = async () => {
            if (!user) return;
            try {
                const res = await fetch(`http://localhost:5000/api/transactions?user_id=${user.user_id}`);
                const data = await res.json();
                setTransactions(data);
            } catch (err) {
                console.error('Failed to load transactions:', err);
            }
        };

        loadTransactions();
    }, [user]);

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

        const entry = {
            ...newTransaction,
            user_id: user.user_id,
            business_id: user.business_id,
        };

        try {
            const res = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            });
            if (res.ok) {
                triggerToast('Transaction added!');
                setIsModalOpen(false);
                setNewTransaction({ amount: '', category: '', note: '', transaction_date: new Date().toISOString().split('T')[0] });
                fetchTransactions();
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                const typedArray = new Uint8Array(fileReader.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let allText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map(item => item.str);
                    allText += strings.join(' ') + '\n';
                }
                console.log('PDF content:', allText);
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    console.log('CSV content:', results.data);
                },
            });
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Transactions</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        + Add Transaction
                    </button>
                    <label className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md cursor-pointer hover:bg-indigo-50">
                        Upload Extract
                        <input type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {toastMessage && (
                <div className="mb-4 text-green-600 font-medium">{toastMessage}</div>
            )}

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

            {/* Modal */}
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
