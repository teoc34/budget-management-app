import { useEffect, useState } from 'react';

const Account = ({ user }) => {
    const [form, setForm] = useState({
        phone: '',
        address: '',
        emergency_contact: '',
        business_id: ''
    });

    const [businesses, setBusinesses] = useState([]);
    const [businessName, setBusinessName] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user?.business_id) {
            fetchUserData();
            fetchBusinessName(user.business_id);
        } else if (user.role !== 'administrator') {
            fetchBusinesses();
        }
    }, [user]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${user.user_id}`);
            const data = await res.json();
            setForm({
                phone: data.phone || '',
                address: data.address || '',
                emergency_contact: data.emergency_contact || '',
                business_id: data.business_id || ''
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchBusinessName = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/businesses/${id}`);
            const data = await res.json();
            setBusinessName(data.name);
        } catch (err) {
            console.error('Error fetching business name:', err);
        }
    };

    const fetchBusinesses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/businesses');
            const data = await res.json();
            setBusinesses(data);
        } catch (err) {
            console.error('Error fetching businesses:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`http://localhost:5000/api/users/${user.user_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            setMessage('✔️ Profile updated!');
        } catch (err) {
            console.error('Error updating user:', err);
            setMessage('❌ Failed to update.');
        }
    };

    if (!user) return <div className="text-center mt-20">Loading account info...</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h2 className="text-2xl font-bold mb-6">Account Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-semibold">Name</label>
                    <input type="text" value={user.name} disabled className="w-full p-2 border rounded bg-gray-100" />
                </div>
                <div>
                    <label className="block font-semibold">Email</label>
                    <input type="email" value={user.email} disabled className="w-full p-2 border rounded bg-gray-100" />
                </div>
                <div>
                    <label className="block font-semibold">Phone</label>
                    <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block font-semibold">Address</label>
                    <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block font-semibold">Emergency Contact</label>
                    <input
                        type="text"
                        value={form.emergency_contact}
                        onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block font-semibold">Business</label>
                    {user.role === 'administrator' || user.business_id ? (
                        <input
                            type="text"
                            value={businessName || '—'}
                            className="w-full p-2 border rounded bg-gray-100"
                            disabled
                        />
                    ) : (
                        <div>
                            <label className="block font-semibold">Your Business</label>
                            <input
                                type="text"
                                value={businessName || "Loading..."}
                                disabled
                                className="w-full p-2 border rounded bg-gray-100"
                            />
                        </div>
                    )
                    }
                </div >

                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Save Changes
                </button>
                {message && <p className="text-green-600 mt-2">{message}</p>}
            </form >
        </div >
    );
};

export default Account;
