import { useState, useEffect } from 'react';

const AdminEmployees = () => {
    // Retrieve logged-in user and token from local storage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // State to hold users and businesses
    const [users, setUsers] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [salary, setSalary] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch only users with role 'user' (employees)
    const fetchUsers = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allUsers = await res.json();
            const onlyEmployees = allUsers.filter((u) => u.role === 'user');
            setUsers(onlyEmployees);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch businesses created by the current admin
    const fetchBusinesses = async () => {
        if (!user?.user_id) return;
        try {
            const res = await fetch(`http://localhost:5000/api/businesses/by-owner/${user.user_id}`);
            const data = await res.json();
            setBusinesses(data);
        } catch (err) {
            console.error('Error fetching businesses:', err);
        }
    };

    // Assign a user to a business
    const assignBusinessToUser = async (userId, businessId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}/assign-business`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ businessId }),
            });

            if (!res.ok) throw new Error('Failed to assign business');
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Error assigning business');
        }
    };

    // Remove a user from their assigned business
    const removeFromBusiness = async (userId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ business_id: '' }),
            });

            if (!res.ok) throw new Error('Failed to remove user from business');
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Error removing user from business');
        }
    };

    // Handle salary saving (placeholder logic)
    const saveSalary = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${editingUser.user_id}/set-salary`, {

                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ salary }),
            });

            if (!res.ok) throw new Error('Failed to update salary');
            alert(`Salary ${salary} RON saved for ${editingUser?.name}`);
            setEditingUser(null);
            setSalary('');
            fetchUsers();
        } catch (err) {
            console.error('Error updating salary:', err);
            alert('Error saving salary');
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchUsers();
        fetchBusinesses();
    }, [user?.user_id]);

    if (loading) return <p>Loading users...</p>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Manage Employees</h2>

            {/* Businesses overview */}
            <div className="grid md:grid-cols-2 gap-4">
                {businesses.map((biz) => (
                    <div key={biz.business_id} className="border p-4 rounded shadow bg-white">
                        <h3 className="text-lg font-semibold mb-2">{biz.name}</h3>

                        {/* Dropdown to assign user to business */}
                        <div className="mb-4">
                            <select
                                className="border p-2 rounded w-full"
                                value={selectedUser || ''}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                <option value="">Select user to add</option>
                                {users
                                    .filter(u => u.business_id !== biz.business_id)
                                    .map((u) => (
                                        <option key={u.user_id} value={u.user_id}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))}
                            </select>
                            <button
                                onClick={() => {
                                    if (selectedUser) assignBusinessToUser(selectedUser, biz.business_id);
                                }}
                                className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                                Add in Business
                            </button>
                        </div>

                        {/* List of assigned users */}
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Assigned Users</h4>
                            {users.filter(u => u.business_id === biz.business_id).map((u) => (
                                <div key={u.user_id} className="flex justify-between items-center text-sm mb-2 p-2 border rounded hover:bg-gray-100 cursor-pointer">
                                    <button
                                        className="flex-1 text-left text-blue-600 hover:underline"
                                        onClick={() => setEditingUser(u)}
                                    >
                                        {u.name} ({u.email})
                                    </button>
                                    <button
                                        onClick={() => removeFromBusiness(u.user_id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for salary editing */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
                        <h3 className="text-xl font-bold mb-4">Edit Salary</h3>
                        <p className="mb-2">{editingUser.name} ({editingUser.email})</p>
                        <input
                            type="number"
                            placeholder="Enter salary in RON"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            className="w-full p-2 border rounded mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                            >Cancel</button>
                            <button
                                onClick={saveSalary}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEmployees;
