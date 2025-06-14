import { useEffect, useState } from 'react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [businesses, setBusinesses] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/users', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then(res => res.json())
            .then(setUsers)
            .catch(err => console.error('Error loading users:', err));

        fetch('http://localhost:5000/api/businesses', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then(res => res.json())
            .then(setBusinesses)
            .catch(err => console.error('Error loading businesses:', err));
    }, []);

    const handleDeleteUser = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            fetch(`http://localhost:5000/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            }).then(() => setUsers(users.filter(u => u.user_id !== id)));
        }
    };

    const handleDeleteBusiness = (id) => {
        if (window.confirm('Deleting this business will remove all associated users. Continue?')) {
            fetch(`http://localhost:5000/api/businesses/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            }).then(() => setBusinesses(businesses.filter(b => b.business_id !== id)));
        }
    };

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-2xl font-bold mb-4">All Users</h2>
                <table className="w-full border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Created</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.user_id} className="border-t">
                                <td className="p-2">{user.name}</td>
                                <td className="p-2">{user.email}</td>
                                <td className="p-2">{user.role}</td>
                                <td className="p-2">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="p-2 space-x-2">
                                    <button className="text-green-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteUser(user.user_id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">All Businesses</h2>
                <table className="w-full border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Created by</th>
                            <th className="p-2"># Employees</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {businesses.map(b => (
                            <tr key={b.business_id} className="border-t">
                                <td className="p-2">{b.name}</td>
                                <td className="p-2">{b.email}</td>
                                <td className="p-2">{b.created_by}</td>
                                <td className="p-2">{b.employee_count || 0}</td>
                                <td className="p-2 space-x-2">
                                    <button className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteBusiness(b.business_id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
