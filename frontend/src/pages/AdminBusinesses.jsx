import { useState, useEffect } from 'react';

const CreateBusiness = ({ user }) => {
    // State to hold the list of businesses created by the user
    const [businesses, setBusinesses] = useState([]);

    // Form state to collect business data
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        cui: '',
        vat_status: 'vat_payer',
        registration_date: '',
        company_type: 'SRL'
    });

    // Message for user feedback
    const [message, setMessage] = useState('');

    // Fetch businesses created by the current user (max 3 allowed)
    useEffect(() => {
        fetch(`http://localhost:5000/api/businesses/by-owner/${user.user_id}`)
            .then(res => res.json())
            .then(data => setBusinesses(data))
            .catch(err => console.error('Error fetching businesses:', err));
    }, [user.user_id]);

    // Validates the email and phone number before submission
    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^0\d{9}$/;

        if (!emailRegex.test(form.email)) {
            setMessage('Email must be valid, e.g. email@example.com');
            return false;
        }

        if (form.phone && !phoneRegex.test(form.phone)) {
            setMessage('Phone must start with 0 and contain exactly 10 digits');
            return false;
        }

        return true;
    };

    // Handles creation of a new business
    const handleCreate = async () => {
        if (businesses.length >= 3) {
            setMessage('You can create a maximum of 3 businesses.');
            return;
        }

        if (!validateForm()) return;

        try {
            const res = await fetch('http://localhost:5000/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    administrator_id: user.user_id
                })
            });

            if (!res.ok) {
                const error = await res.json();
                setMessage(error.error || 'Error while creating.');
                return;
            }

            const created = await res.json();
            setBusinesses([...businesses, created]);
            setMessage('Business created successfully!');
            // Reset form to initial state
            setForm({
                name: '',
                email: '',
                phone: '',
                cui: '',
                vat_status: 'vat_payer',
                registration_date: '',
                company_type: 'SRL'
            });
        } catch (err) {
            console.error('Error:', err);
            setMessage('Server error.');
        }
    };

    // Handles deletion of a business
    const handleDelete = async (business_id) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this business?');
        if (!confirmDelete) return;

        try {
            const res = await fetch(`http://localhost:5000/api/businesses/${business_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const error = await res.json();
                setMessage(error.error || 'Failed to delete business.');
                return;
            }

            setBusinesses(businesses.filter(b => b.business_id !== business_id));
            setMessage('Business deleted successfully.');
        } catch (err) {
            console.error('Error deleting business:', err);
            setMessage('Server error.');
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Create New Business</h2>

            {/* Form inputs */}
            <div className="space-y-3">
                <input type="text" placeholder="Business Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" />
                <input type="email" placeholder="Business Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border p-2 rounded" />
                <input type="text" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border p-2 rounded" />
                <input type="text" placeholder="CUI / CIF" value={form.cui} onChange={(e) => setForm({ ...form, cui: e.target.value })} className="w-full border p-2 rounded" />

                <div>
                    <label className="block text-sm font-medium mb-1">VAT Status</label>
                    <select value={form.vat_status} onChange={(e) => setForm({ ...form, vat_status: e.target.value })} className="w-full border p-2 rounded">
                        <option value="vat_payer">VAT Payer</option>
                        <option value="non_vat_payer">Non-VAT Payer</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Registration Date</label>
                    <input type="date" value={form.registration_date} onChange={(e) => setForm({ ...form, registration_date: e.target.value })} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Company Type</label>
                    <select value={form.company_type} onChange={(e) => setForm({ ...form, company_type: e.target.value })} className="w-full border p-2 rounded">
                        <option value="SRL">SRL</option>
                        <option value="PFA">PFA</option>
                    </select>
                </div>

                <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Save Business</button>

                {message && <div className="text-sm mt-2 text-center text-gray-700 font-medium">{message}</div>}
            </div>

            {/* List of created businesses */}
            {businesses.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Your Businesses</h3>
                    <ul className="space-y-2">
                        {businesses.map(b => (
                            <li key={b.business_id || b.id} className="border p-3 rounded relative">
                                <button onClick={() => handleDelete(b.business_id || b.id)} className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold">×</button>
                                <div className="font-bold">{b.name}</div>
                                <div className="text-sm text-gray-600">
                                    CUI: {b.cui || 'N/A'} | VAT: {b.vat_status || 'N/A'} | Type: {b.company_type || 'N/A'}<br />
                                    Email: {b.email || 'N/A'} | Phone: {b.phone || 'N/A'} | Registered on: {b.registration_date ? b.registration_date.slice(0, 10) : 'N/A'}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CreateBusiness;
