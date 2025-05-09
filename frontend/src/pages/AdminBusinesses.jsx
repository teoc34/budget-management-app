import { useState, useEffect } from 'react';

const AdminBusinesses = ({ user }) => {
    const [businesses, setBusinesses] = useState([]);
    const [hasBusiness, setHasBusiness] = useState(false);
    const [newBusiness, setNewBusiness] = useState({ name: '', email: '', phone: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        const checkExistingBusiness = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/businesses');
                const data = await res.json();
                const found = data.find(b => b.administrator_id === user.user_id);
                if (found) {
                    setBusinesses([found]);
                    setHasBusiness(true);
                }
            } catch (err) {
                console.error('Error checking business:', err);
            }
        };
        checkExistingBusiness();
    }, [user.user_id]);

    const handleCreate = async () => {
        const { name, email, phone } = newBusiness;
        if (!name || !email) return alert('Name and email are required.');

        try {
            const res = await fetch('http://localhost:5000/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newBusiness,
                    administrator_id: user.user_id
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || 'Failed to create business.');
                return;
            }

            setBusinesses([data]);
            setHasBusiness(true);
            setMessage('✅ Business successfully created.');
        } catch (err) {
            console.error('Error creating business:', err);
            setMessage('❌ Error while creating business.');
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 bg-white shadow rounded p-6">
            <h2 className="text-2xl font-bold mb-4">Create Your Business</h2>

            {hasBusiness ? (
                <div>
                    <p className="text-green-700 mb-4">You have already created a business:</p>
                    <div className="bg-gray-100 p-4 rounded">
                        <p><strong>Name:</strong> {businesses[0].name}</p>
                        <p><strong>Email:</strong> {businesses[0].email}</p>
                        <p><strong>Phone:</strong> {businesses[0].phone}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Business Name"
                        value={newBusiness.name}
                        onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="email"
                        placeholder="Business Email"
                        value={newBusiness.email}
                        onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={newBusiness.phone}
                        onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Create Business
                    </button>
                    {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
                </div>
            )}
        </div>
    );
};

export default AdminBusinesses;
