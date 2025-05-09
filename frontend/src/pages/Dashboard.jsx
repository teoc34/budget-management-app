import { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AccountHome from './AccountHome';
import Account from './Account';
import Transactions from './Transactions';
import AdminBusinesses from './AdminBusinesses';
const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            console.log('Loaded user from localStorage:', storedUser);
            setUser(storedUser);
        } else {
            navigate('/signin');
        }
    }, [navigate]);


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
                    <Link to="/dashboard/accounthome" className="hover:underline">Dashboard</Link>
                    <Link to="/dashboard/account" className="hover:underline">Account Info</Link>
                    <Link to="/dashboard/transactions" className="hover:underline">Transactions</Link>
                    {user.role === 'administrator' && (
                        <Link to="/dashboard/admin/businesses" className="hover:underline">Create Business</Link>
                    )}
                    <button onClick={handleLogout} className="hover:underline">Logout</button>
                </div>
                <div>Welcome, {user.name}!</div>
            </nav>

            <div className="p-6 flex-grow">
                <Routes>
                    <Route path="accounthome" element={<AccountHome user={user} />} />
                    <Route path="account" element={<Account user={user} />} />
                    <Route path="transactions" element={<Transactions user={user} />} />
                    {user.role === 'administrator' && (
                        <Route path="admin/businesses" element={<AdminBusinesses user={user} />} />
                    )}
                    <Route path="*" element={<Navigate to="accounthome" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
