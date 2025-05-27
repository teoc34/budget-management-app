import { useEffect, useState } from 'react';

const Account = ({ user }) => {
    const [form, setForm] = useState({
        phone: '',
        address: '',
        emergency_contact: '',
        business_id: ''
    });

    const [businessName, setBusinessName] = useState('');
    const [businesses, setBusinesses] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user?.user_id) {
            fetchUserData();
        }
    }, [user]);

    useEffect(() => {
        if (form.business_id) {
            fetchBusinessName(form.business_id);
        }
    }, [form.business_id]);

    useEffect(() => {
        if (user?.role === 'user' && !form.business_id) {
            fetchAllBusinesses();
        }
    }, [user, form.business_id]);

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

    const fetchBusinessName = async (businessId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/businesses/${businessId}`);
            const data = await res.json();
            if (data?.name) setBusinessName(data.name);
        } catch (error) {
            console.error("Error fetching business name:", error);
        }
    };

    const fetchAllBusinesses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/businesses');
            const data = await res.json();
            setBusinesses(data);
        } catch (error) {
            console.error("Error fetching businesses:", error);
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

                {/* Business logic based on role */}
                {user.role === 'user' && (
                    <div>
                        <label className="block font-semibold">Business</label>
                        {form.business_id ? (
                            <input
                                type="text"
                                value={businessName || '—'}
                                className="w-full p-2 border rounded bg-gray-100"
                                disabled
                            />
                        ) : (
                            <select
                                value={form.business_id}
                                onChange={(e) => setForm({ ...form, business_id: e.target.value })}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select a business</option>
                                {businesses.map(b => (
                                    <option key={b.business_id} value={b.business_id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Save Changes
                </button>
                {message && <p className="text-green-600 mt-2">{message}</p>}
            </form>
        </div>
    );
};

export default Account;
