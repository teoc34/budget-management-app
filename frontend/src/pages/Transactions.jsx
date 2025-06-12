import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Transactions = ({ user, onTransactionAdded }) => {
    // State declarations
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [accountantBusinesses, setAccountantBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        amount: '',
        category: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0],
        business_id: ''
    });

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [exportFormat, setExportFormat] = useState('excel');
    const [exportBusinessId, setExportBusinessId] = useState('');
    const [exportErrorMessage, setExportErrorMessage] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employeeList, setEmployeeList] = useState([]);
    const [isBusinessExpense, setIsBusinessExpense] = useState(true);

    const [toastMessage, setToastMessage] = useState('');

    const employeeCategories = ['Subscriptions', 'Groceries', 'Shopping', 'Health', 'Wellness', 'Emergency Fund', 'Vacation', 'Investment', 'Other'];
    const businessCategories = ['Rent', 'Transport', 'Utilities', 'Medical', 'Entertainment', 'Office Supplies', 'Other'];
    const availableCategories = user.role === 'user' ? employeeCategories : businessCategories;

    // Fetch businesses and transactions
    useEffect(() => {
        fetchTransactions();

        if (user?.role === 'accountant') {
            fetch(`http://localhost:5000/api/accountants/${user.user_id}`)
                .then(res => res.json())
                .then(setAccountantBusinesses)
                .catch(err => console.error('Error fetching businesses (accountant):', err));
        }

        if (user?.role === 'administrator') {
            fetch(`http://localhost:5000/api/businesses/by-owner/${user.user_id}`)
                .then(res => res.json())
                .then(setAccountantBusinesses)
                .catch(err => console.error('Error fetching businesses (admin):', err));
        }
    }, [selectedBusinessId]);

    // Fetch transactions from backend
    const fetchTransactions = async () => {
        try {
            let endpoint = 'http://localhost:5000/api/transactions';
            if ((user.role === 'accountant' || user.role === 'administrator') && selectedBusinessId) {
                endpoint += `?business_id=${selectedBusinessId}`;
            }
            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setTransactions(data);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        }
    };

    // Filter and sort transactions
    useEffect(() => {
        let filtered = [...transactions];

        if (categoryFilter) {
            filtered = filtered.filter(tx => tx.category === categoryFilter);
        }

        if (monthFilter) {
            filtered = filtered.filter(tx => {
                const txMonth = new Date(tx.transaction_date).getMonth() + 1;
                return txMonth === Number(monthFilter);
            });
        }

        filtered.sort((a, b) => sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount);
        setFilteredTransactions(filtered);
    }, [transactions, categoryFilter, monthFilter, sortOrder]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/users/employees', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const data = await res.json();
                console.log("[DEBUG] Employees fetched:", data); // Adaugă asta
                setEmployeeList(data);
            } catch (err) {
                console.error('Error fetching employees:', err);
                setEmployeeList([]); // fallback la array gol
            }
        };

        if (user.role === 'administrator' || user.role === 'accountant') {
            fetchEmployees();
        }
    }, [user.role]);



    // Show toast messages
    const triggerToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Save new transaction
    const handleSaveTransaction = async () => {
        const tx = editingTransaction || newTransaction;
        if (!tx.amount || !tx.category) {
            triggerToast('Please fill out all fields!');
            return;
        }
        const payload = {
            amount: tx.amount,
            category: tx.category,
            note: tx.note,
            transaction_date: tx.transaction_date,
            business_id: (user.role === 'user' && !isBusinessExpense) ? null :
                (user.role === 'accountant' || user.role === 'administrator') ? tx.business_id || selectedBusinessId : user.business_id,
            is_business_expense: isBusinessExpense,
        };
        try {
            const endpoint = editingTransaction
                ? `http://localhost:5000/api/transactions/${editingTransaction.transaction_id}`
                : 'http://localhost:5000/api/transactions';

            const method = editingTransaction ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                triggerToast(editingTransaction ? 'Transaction updated!' : 'Transaction added!');
                setIsModalOpen(false);
                setEditingTransaction(null);
                setNewTransaction({ amount: '', category: '', note: '', transaction_date: new Date().toISOString().split('T')[0], business_id: '' });
                fetchTransactions();
                if (onTransactionAdded) onTransactionAdded();
            } else {
                const error = await res.json();
                triggerToast(error.message || 'Transaction failed');
            }
        } catch (error) {
            console.error(error);
            triggerToast('Something went wrong!');
        }
    };

    // Reverse a transaction
    const handleReverseTransaction = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/transactions/${id}/reverse`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                triggerToast('Transaction reversed.');
                fetchTransactions();
            } else {
                triggerToast('Failed to reverse.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Placeholder for modifying a transaction
    const handleModifyTransaction = (transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const currentTransaction = editingTransaction || newTransaction;
    // Get unique categories for filtering
    const categories = Array.from(new Set(transactions.map(tx => tx.category)));

    // Helper function to handle export with filters (from export modal values)
    const handleExport = (filters) => {
        const params = new URLSearchParams();

        // Start and end date (exact from datepickers)
        if (filters.startDate) params.append("start", filters.startDate.toISOString().split("T")[0]);
        if (filters.endDate) params.append("end", filters.endDate.toISOString().split("T")[0]);

        // Category filter
        if (filters.category) params.append("category", filters.category);

        // Business filter
        if ((user.role === "accountant" || user.role === "administrator") && filters.businessId) {
            params.append("business_id", filters.businessId);
        }

        params.append("format", filters.format);

        const url = `http://localhost:5000/api/transactions/export?${params.toString()}`;
        fetch(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then(res => res.blob())
            .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = filters.format === "pdf" ? "transactions.pdf" : "transactions.xlsx";
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch(err => console.error("Export failed:", err));
    };


    return (
        // Wrapper for the entire transactions page
        <div className="bg-white p-6 rounded shadow-md">

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Transactions</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Export Transactions
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                        + Add Transaction
                    </button>
                </div>
            </div>


            {/* Filters and sort section */}
            <div className="bg-white p-6 rounded shadow-md">


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Filter by category */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">Filter by Category</label>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full border p-2 rounded">
                            <option value="">All</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    {/* Filter by month */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">Filter by Month</label>
                        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-full border p-2 rounded">
                            <option value="">All</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{format(new Date(2000, i, 1), 'MMMM')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Business dropdown for accountant/administrator */}
                    {['accountant', 'administrator'].includes(user.role) && (
                        <div>
                            <label className="block mb-1 text-sm font-medium">Select Business</label>
                            <select
                                value={selectedBusinessId}
                                onChange={(e) => setSelectedBusinessId(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">-- All Businesses --</option>
                                {accountantBusinesses.map((biz) => (
                                    <option key={biz.business_id} value={biz.business_id}>{biz.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {(user.role === 'administrator' || user.role === 'accountant') && (
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium">Filter by Employee</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="border p-2 rounded w-full max-w-md"
                        >
                            <option value="">All</option>
                            {employeeList.map((emp, idx) => (
                                <option key={idx} value={emp.user_id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                )}


                {/* Sorting button */}
                <div className="mb-4">
                    <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                    >
                        Sort by Amount ({sortOrder === 'desc' ? 'Largest to Smallest' : 'Smallest to Largest'})
                    </button>
                </div>
            </div>

            {/* Toast notification */}
            {toastMessage && <div className="mb-4 text-green-600 font-medium">{toastMessage}</div>}

            {/* Render transactions or empty message */}
            {filteredTransactions.length === 0 ? (
                <p className="text-gray-500">No transactions yet.</p>
            ) : (
                <div className="space-y-4">
                    {filteredTransactions.map((tx) => (
                        <div key={tx.transaction_id} className="p-4 bg-gray-100 rounded-md shadow">
                            <div className="flex justify-between">
                                <div>
                                    <h4 className="font-semibold">{tx.category}</h4>
                                    <p className="text-sm text-gray-600">{tx.note || 'No note'}</p>
                                    <p className="text-xs text-gray-500">Added by {tx.added_by}</p>

                                    {/* Actions for accountants */}
                                    {user.role === 'accountant' && (
                                        <div className="flex gap-2 mt-2">
                                            {!tx.reversed && (
                                                <>
                                                    <button
                                                        onClick={() => handleReverseTransaction(tx.transaction_id)}
                                                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition"
                                                    >
                                                        Reverse
                                                    </button>
                                                    <button
                                                        onClick={() => handleModifyTransaction(tx)}
                                                        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition"
                                                    >
                                                        Modify
                                                    </button>
                                                </>
                                            )}
                                            {tx.reversed && <span className="text-red-500 text-xs">(Reversed)</span>}
                                        </div>
                                    )}

                                    {tx.reversed && <span className="text-red-500 text-xs ml-2">(Reversed)</span>}
                                </div>

                                <div className="text-right">
                                    {/* Round the amount to two decimal places */}
                                    <p className="font-bold text-indigo-600">{Number(tx.amount).toFixed(2)} RON</p>
                                    <p className="text-xs text-gray-500">{format(new Date(tx.transaction_date), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-lg relative shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Export Transactions</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();

                                if (startDate && endDate && startDate > endDate) {
                                    setExportErrorMessage('⚠️ Start date cannot be after end date.');
                                    return;
                                }

                                const params = new URLSearchParams();

                                // Calculate start and end from selected month (if exists)
                                if (monthFilter) {
                                    const month = Number(monthFilter);
                                    const year = new Date().getFullYear(); // or let user pick year
                                    const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
                                    const end = new Date(year, month, 0).toISOString().split("T")[0]; // last day of month
                                    params.append("start", start);
                                    params.append("end", end);
                                }

                                // Category filter
                                if (categoryFilter) params.append("category", categoryFilter);

                                // Business filter (for accountant/administrator)
                                if ((user.role === "accountant" || user.role === "administrator") && selectedBusinessId) {
                                    params.append("business_id", selectedBusinessId);
                                }

                                // Format (excel/pdf)
                                params.append("format", exportFormat);

                                const url = `http://localhost:5000/api/transactions/export?${params.toString()}`;
                                fetch(url, {
                                    headers: {
                                        Authorization: `Bearer ${localStorage.getItem('token')}`
                                    }
                                })
                                    .then(res => res.blob())
                                    .then(blob => {
                                        const downloadUrl = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = downloadUrl;
                                        link.download = exportFormat === 'excel' ? 'transactions.xlsx' : 'transactions.pdf';
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    })
                                    .catch(err => console.error('Export failed:', err));

                                setIsExportModalOpen(false);
                                setExportErrorMessage('');
                            }}

                            className="space-y-4"
                        >
                            <div className="flex flex-col">
                                {exportErrorMessage && (
                                    <p className="text-red-500 text-sm mb-3">{exportErrorMessage}</p>
                                )}

                                <label className="text-sm mb-1">Start Date</label>
                                <DatePicker selected={startDate} onChange={setStartDate} className="p-2 border rounded" placeholderText="Start" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm mb-1">End Date</label>
                                <DatePicker selected={endDate} onChange={setEndDate} className="p-2 border rounded" placeholderText="End" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm mb-1">Category</label>
                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 border rounded">
                                    <option value="">All Categories</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {(user.role === 'accountant' || user.role === 'administrator') && (
                                <div className="flex flex-col">
                                    <label className="text-sm mb-1">Business</label>
                                    <select
                                        className="p-2 border rounded"
                                        value={exportBusinessId}
                                        onChange={(e) => setExportBusinessId(e.target.value)}
                                    >
                                        <option value="">Select Business</option>
                                        {accountantBusinesses.map(biz => (
                                            <option key={biz.business_id} value={biz.business_id}>
                                                {biz.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex flex-col">
                                <label className="text-sm mb-1">Format</label>
                                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="p-2 border rounded">
                                    <option value="excel">Excel</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsExportModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export</button>
                            </div>
                        </form>
                        <button onClick={() => setIsExportModalOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl">×</button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
                        <h3 className="text-xl font-bold mb-4">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-full mb-2 p-2 border rounded"
                            value={currentTransaction.amount}
                            onChange={(e) => {
                                const updated = { ...currentTransaction, amount: e.target.value };
                                editingTransaction ? setEditingTransaction(updated) : setNewTransaction(updated);
                            }}
                        />
                        <select
                            className="w-full mb-2 p-2 border rounded"
                            value={currentTransaction.category}
                            onChange={(e) => {
                                const updated = { ...currentTransaction, category: e.target.value };
                                editingTransaction ? setEditingTransaction(updated) : setNewTransaction(updated);
                            }}
                        >
                            <option value="">Select Category</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <DatePicker
                            selected={new Date(currentTransaction.transaction_date)}
                            onChange={(date) => {
                                const updated = { ...currentTransaction, transaction_date: date.toISOString().split('T')[0] };
                                editingTransaction ? setEditingTransaction(updated) : setNewTransaction(updated);
                            }}
                            className="w-full mb-2 p-2 border rounded"
                            dateFormat="dd MMM yyyy"
                        />
                        <textarea
                            placeholder="Note (optional)"
                            className="w-full mb-4 p-2 border rounded"
                            value={currentTransaction.note}
                            onChange={(e) => {
                                const updated = { ...currentTransaction, note: e.target.value };
                                editingTransaction ? setEditingTransaction(updated) : setNewTransaction(updated);
                            }}
                        />
                        {(user.role === 'accountant' || user.role === 'administrator') && (
                            <select
                                className="w-full mb-4 p-2 border rounded"
                                value={currentTransaction.business_id || ''}
                                onChange={(e) => {
                                    const updated = { ...currentTransaction, business_id: e.target.value };
                                    editingTransaction ? setEditingTransaction(updated) : setNewTransaction(updated);
                                }}
                            >
                                <option value="">Select Business</option>
                                {accountantBusinesses.map(biz => (
                                    <option key={biz.business_id} value={biz.business_id}>{biz.name}</option>
                                ))}
                            </select>
                        )}

                        {user.role === 'user' && (
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    id="isBusinessExpense"
                                    checked={isBusinessExpense}
                                    onChange={(e) => setIsBusinessExpense(e.target.checked)}
                                    className="mr-2"
                                />
                                <label htmlFor="isBusinessExpense">Mark as business expense</label>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button onClick={() => {
                                setIsModalOpen(false);
                                setEditingTransaction(null);
                            }} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={handleSaveTransaction} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                        </div>
                        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl" onClick={() => {
                            setIsModalOpen(false);
                            setEditingTransaction(null);
                        }}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;