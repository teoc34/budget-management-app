import { useEffect, useState } from 'react';

const AccountantBusinesses = ({ user }) => {
    const [allBusinesses, setAllBusinesses] = useState([]);
    const [associatedBusinesses, setAssociatedBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadBusinesses = async () => {
            await fetchAssociatedBusinesses();
            await fetchAllBusinesses();
        };
        if (user?.user_id) {
            loadBusinesses();
        }
    }, [user?.user_id]);

    const fetchAssociatedBusinesses = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/accountants/${user.user_id}`);
            const data = await res.json();
            const unique = Array.from(new Map(data.map(b => [b.business_id, b])).values());
            setAssociatedBusinesses(unique);
        } catch (err) {
            console.error('Error fetching associated businesses:', err);
        }
    };

    const fetchAllBusinesses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/businesses');
            const data = await res.json();

            // Filter out already associated businesses
            const filtered = data.filter(
                biz => !associatedBusinesses.some(ab => ab.business_id === biz.business_id)
            );

            setAllBusinesses(filtered);
        } catch (err) {
            console.error('Error fetching businesses:', err);
        }
    };

    const handleAssociate = async () => {
        if (!selectedBusinessId) return;

        const alreadyAssociated = associatedBusinesses.some(
            b => String(b.business_id) === String(selectedBusinessId)
        );
        if (alreadyAssociated) {
            setMessage('⚠️ You are already associated with this business.');
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/accountants/associate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountant_id: user.user_id,
                    business_id: selectedBusinessId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || '❌ Failed to associate business.');
                return;
            }

            setMessage('✅ Successfully associated with business!');
            setSelectedBusinessId('');
            await fetchAssociatedBusinesses();
            await fetchAllBusinesses();
        } catch (err) {
            console.error('Error associating business:', err);
            setMessage('❌ Association failed.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow rounded p-6">
            <h2 className="text-2xl font-bold mb-6">Associate With a Business</h2>

            <div className="flex gap-4 items-center mb-6">
                <select
                    className="flex-1 border p-2 rounded"
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                    <option value="">Select a business</option>
                    {allBusinesses.map((biz) => (
                        <option key={`biz-${biz.business_id}`} value={biz.business_id}>
                            {biz.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAssociate}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Associate
                </button>
            </div>

            {message && <p className="text-sm mb-4 text-indigo-700">{message}</p>}

            <h3 className="text-lg font-semibold mb-4">Your Businesses</h3>
            {associatedBusinesses.length > 0 ? (
                <div className="space-y-4">
                    {associatedBusinesses.map((biz) => (
                        <div key={`assoc-${biz.business_id}`} className="p-4 border rounded shadow bg-gray-50">
                            <p><strong>Name:</strong> {biz.name}</p>
                            <p><strong>Email:</strong> {biz.email}</p>
                            <p><strong>Phone:</strong> {biz.phone || '—'}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-600">You are not yet associated with any business.</p>
            )}
        </div>
    );
};

export default AccountantBusinesses;
