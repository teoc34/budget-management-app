import { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AccountHome from './AccountHome';
import AccountantHome from './AccountantHome';
import EmployeeHome from './EmployeeHome';
import Account from './Account';
import Transactions from './Transactions';
import AdminBusinesses from './AdminBusinesses';
import AccountantBusinesses from './AccountantBusinesses';
import Insights from './Insights';
import AdminEmployees from './AdminEmployees';
import IncomePage from './IncomePage';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [selectedBusinessName, setSelectedBusinessName] = useState('');
    const [accountantBusinesses, setAccountantBusinesses] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        } else {
            navigate('/signin');
        }
    }, [navigate]);

    useEffect(() => {
        if (user?.role === 'accountant') {
            fetch(`http://localhost:5000/api/accountants/${user.user_id}`)
                .then(res => res.json())
                .then(setAccountantBusinesses)
                .catch(err => console.error('Failed to load accountant businesses:', err));
        }
    }, [user]);

    useEffect(() => {
        const fetchTransactions = async () => {
            const res = await fetch('http://localhost:5000/api/transactions', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            setTransactions(data);
        };

        fetchTransactions();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/signin');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <nav className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                <div className="text-2xl font-bold">MyBudgetApp</div>
                <div className="flex space-x-6">
                    <Link
                        to={
                            user.role === 'admin'
                                ? '/dashboard/admin'
                                : '/dashboard/accounthome'
                        }
                        className="hover:underline"
                    >
                        Dashboard
                    </Link>
                    <Link to="/dashboard/account" className="hover:underline">Account Info</Link>
                    <Link to="/dashboard/transactions" className="hover:underline">Transactions</Link>

                    {user.role === 'accountant' && (
                        <>
                            <Link to="/dashboard/accountant/businesses" className="hover:underline">Add Business</Link>
                            <Link to="/dashboard/admin/income" className="hover:underline">Income</Link>
                        </>
                    )}
                    {user.role === 'administrator' && (
                        <>
                            <Link to="/dashboard/admin/businesses" className="hover:underline">Create Business</Link>
                            <Link to="/dashboard/admin/income" className="hover:underline">Income</Link>
                            <Link to="/dashboard/admin/employees" className="hover:underline">Employees</Link>
                        </>
                    )}
                    {user.role === 'admin' && (
                        <>
                            <Link to="/dashboard/admin" className="hover:underline">Admin Dashboard</Link>
                        </>
                    )}

                    <button onClick={handleLogout} className="hover:underline">Logout</button>
                </div>
                <div>Welcome, {user.name}!</div>
            </nav>

            <div className="p-6 flex-grow">
                <Routes>
                    <Route
                        path="accounthome"
                        element={
                            user.role === 'administrator' ? (
                                <AccountHome
                                    user={user}
                                    selectedBusinessId={selectedBusinessId}
                                    setSelectedBusinessId={setSelectedBusinessId}
                                    accountantBusinesses={accountantBusinesses}
                                />
                            ) : user.role === 'accountant' ? (
                                <AccountantHome
                                    user={user}
                                    selectedBusinessId={selectedBusinessId}
                                    setSelectedBusinessId={setSelectedBusinessId}
                                    accountantBusinesses={accountantBusinesses}
                                />
                            ) : user.role === 'user' ? (
                                <EmployeeHome user={user} transactions={transactions} />
                            ) : (
                                <AdminDashboard user={user} transactions={transactions} />
                            )
                        }
                    />

                    <Route path="account" element={<Account user={user} />} />
                    <Route path="insights" element={<Insights user={user} selectedBusinessId={selectedBusinessId || ''} />} />
                    <Route
                        path="transactions"
                        element={
                            <Transactions
                                user={user}
                                selectedBusinessId={selectedBusinessId}
                                setSelectedBusinessId={setSelectedBusinessId}
                                accountantBusinesses={accountantBusinesses}
                            />
                        }
                    />

                    {user.role === 'accountant' && (
                        <>
                            <Route path="accountant/businesses" element={<AccountantBusinesses user={user} />} />
                            <Route path="admin/income" element={
                                <IncomePage
                                    user={user}
                                    selectedBusinessId={selectedBusinessId}
                                    setSelectedBusinessId={setSelectedBusinessId}
                                />
                            } />
                        </>
                    )}

                    {user.role === 'administrator' && (
                        <>
                            <Route path="admin/businesses" element={<AdminBusinesses user={user} />} />
                            <Route path="admin/employees" element={<AdminEmployees />} />
                            <Route path="admin/income" element={
                                <IncomePage
                                    user={user}
                                    selectedBusinessId={selectedBusinessId}
                                    setSelectedBusinessId={setSelectedBusinessId}
                                />
                            } />
                        </>
                    )}

                    {user.role === 'admin' && (
                        <>
                            <Route path="admin" element={<AdminDashboard user={user} />} />
                        </>
                    )}

                    <Route
                        path="*"
                        element={
                            user.role === 'admin'
                                ? <Navigate to="/dashboard/admin" replace />
                                : <Navigate to="accounthome" replace />
                        }
                    />
                </Routes>
            </div>
        </div>
    );

};

export default Dashboard;
