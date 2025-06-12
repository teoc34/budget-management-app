import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const IncomePage = ({ user }) => {
    const [incomes, setIncomes] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [accountantBusinesses, setAccountantBusinesses] = useState([]);
    const [clientFilter, setClientFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [businessFilter, setBusinessFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [newIncome, setNewIncome] = useState({
        amount: '',
        client_name: '',
        note: '',
        transaction_date: new Date().toISOString().split('T')[0],
        business_id: '',
    });

    const currentIncome = editingIncome || newIncome;

    const fetchIncomes = () => {
        let endpoint = 'http://localhost:5000/api/transactions/incomes';
        if ((user.role === 'accountant' || user.role === 'administrator') && businessFilter) {
            endpoint += `?business_id=${businessFilter}`;
        }
        fetch(endpoint, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then(res => res.json())
            .then(setIncomes)
            .catch(err => console.error('Failed to fetch incomes:', err));
    };

    useEffect(fetchIncomes, [businessFilter]);

    useEffect(() => {
        let filtered = [...incomes];
        if (clientFilter) filtered = filtered.filter(tx => tx.client_name?.toLowerCase() === clientFilter.toLowerCase());
        if (monthFilter) filtered = filtered.filter(tx => new Date(tx.transaction_date).getMonth() + 1 === Number(monthFilter));
        filtered.sort((a, b) => {
            const nameA = a.client_name || '';
            const nameB = b.client_name || '';
            return nameA.localeCompare(nameB);
        });

        if (sortOrder === 'desc') filtered.reverse();
        setFiltered(filtered);
    }, [incomes, clientFilter, monthFilter, sortOrder]);

    useEffect(() => {
        if (user?.role === 'accountant') {
            fetch(`http://localhost:5000/api/accountants/${user.user_id}`)
                .then(res => res.json())
                .then(setAccountantBusinesses)
                .catch(console.error);
        }
        if (user?.role === 'administrator') {
            fetch(`http://localhost:5000/api/businesses/by-owner/${user.user_id}`)
                .then(res => res.json())
                .then(setAccountantBusinesses)
                .catch(console.error);
        }
    }, []);

    const handleSave = async () => {
        const endpoint = editingIncome
            ? `http://localhost:5000/api/transactions/incomes/${editingIncome.transaction_id}`
            : 'http://localhost:5000/api/transactions/incomes';

        const res = await fetch(endpoint, {
            method: editingIncome ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(currentIncome)
        });

        if (res.ok) {
            fetchIncomes();
            setNewIncome({ amount: '', client_name: '', note: '', transaction_date: new Date().toISOString().split('T')[0], business_id: '' });
            setEditingIncome(null);
            setIsModalOpen(false);
        }
    };

    const handleEdit = (income) => {
        setEditingIncome(income);
        setIsModalOpen(true);
    };

    const handleReverse = async (id) => {
        const res = await fetch(`http://localhost:5000/api/transactions/incomes/${id}/reverse`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) fetchIncomes();
    };

    return (
        <div className="bg-white p-6 rounded shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Income Overview</h2>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded">+ Add Income</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="border p-2 rounded">
                    <option value="">All Clients</option>
                    {[...new Set(incomes.map(i => i.client_name))].map(client => <option key={client}>{client}</option>)}
                </select>

                <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="border p-2 rounded">
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM')}</option>)}
                </select>

                {(user.role === 'accountant' || user.role === 'administrator') && (
                    <select value={businessFilter} onChange={e => setBusinessFilter(e.target.value)} className="border p-2 rounded">
                        <option value="">All Businesses</option>
                        {accountantBusinesses.map(b => <option key={b.business_id} value={b.business_id}>{b.name}</option>)}
                    </select>
                )}

                <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Sort by Client ({sortOrder === 'desc' ? '↓' : '↑'})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Client</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Business</th>
                            <th className="p-2">Note</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((inc, idx) => (
                            <tr key={idx} className="border-b">
                                <td className="p-2">{format(new Date(inc.transaction_date), 'dd MMM yyyy')}</td>
                                <td className="p-2 capitalize">{inc.client_name}</td>
                                <td className="p-2">{Number(inc.amount).toLocaleString()} RON</td>
                                <td className="p-2">{accountantBusinesses.find(b => b.business_id === inc.business_id)?.name || inc.business_id}</td>
                                <td className="p-2">{inc.note || '-'}</td>
                                <td className="p-2 flex gap-2">
                                    {!inc.reversed && user.role === 'accountant' && (
                                        <>
                                            <button onClick={() => handleReverse(inc.transaction_id)} className="text-red-500 hover:text-red-700 text-lg">×</button>
                                            <button onClick={() => handleEdit(inc)} className="text-yellow-500 hover:text-yellow-700 text-lg">✎</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">{editingIncome ? 'Edit Income' : 'Add Income'}</h3>
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-full mb-2 p-2 border rounded"
                            value={currentIncome.amount}
                            onChange={(e) => setEditingIncome(editingIncome ? { ...editingIncome, amount: e.target.value } : { ...newIncome, amount: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Client Name"
                            className="w-full mb-2 p-2 border rounded"
                            value={currentIncome.client_name}
                            onChange={(e) => setEditingIncome(editingIncome ? { ...editingIncome, client_name: e.target.value } : { ...newIncome, client_name: e.target.value })}
                        />
                        <textarea
                            placeholder="Note (optional)"
                            className="w-full mb-2 p-2 border rounded"
                            value={currentIncome.note}
                            onChange={(e) => setEditingIncome(editingIncome ? { ...editingIncome, note: e.target.value } : { ...newIncome, note: e.target.value })}
                        />
                        <DatePicker
                            selected={new Date(currentIncome.transaction_date)}
                            onChange={(date) => setEditingIncome(editingIncome ? { ...editingIncome, transaction_date: date.toISOString().split('T')[0] } : { ...newIncome, transaction_date: date.toISOString().split('T')[0] })}
                            className="w-full mb-2 p-2 border rounded"
                            dateFormat="yyyy-MM-dd"
                        />
                        {(user.role === 'accountant' || user.role === 'administrator') && (
                            <select
                                className="w-full mb-4 p-2 border rounded"
                                value={currentIncome.business_id}
                                onChange={(e) => setEditingIncome(editingIncome ? { ...editingIncome, business_id: e.target.value } : { ...newIncome, business_id: e.target.value })}
                            >
                                <option value="">Select Business</option>
                                {accountantBusinesses.map(b => (
                                    <option key={b.business_id} value={b.business_id}>{b.name}</option>
                                ))}
                            </select>
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => {
                                setIsModalOpen(false);
                                setEditingIncome(null);
                            }} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomePage;
