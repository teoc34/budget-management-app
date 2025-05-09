// src/pages/Businesses.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Businesses = () => {
    const [businesses, setBusinesses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBusiness, setNewBusiness] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user || user.role !== 'accountant') {
            navigate('/dashboard/accounthome');
        } else {
            fetchBusinesses();
        }
    }, []);

    const fetchBusinesses = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/businesses/accountant/${user.user_id}`);
            const data = await res.json();
            setBusinesses(data);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        }
    };

    const handleAddBusiness = async () => {
        const { name, email, phone } = newBusiness;
        if (!name || !email) return alert('Name and email are required.');

        try {
            const res = await fetch('http://localhost:5000/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newBusiness, accountant_id: user.user_id })
            });
            const data = await res.json();
            setBusinesses((prev) => [...prev, data]);
            setNewBusiness({ name: '', email: '', phone: '' });
        } catch (error) {
            console.error('Error adding business:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6">Businesses You Manage</h2>

            <div className="bg-white p-4 rounded shadow mb-6">
                <h3 className="font-semibold text-lg mb-4">Add New Business</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <input
                        type="text"
                        placeholder="Business Name"
                        value={newBusiness.name}
                        onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                        className="border rounded p-2"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={newBusiness.email}
                        onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                        className="border rounded p-2"
                    />
                    <input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={newBusiness.phone}
                        onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                        className="border rounded p-2"
                    />
                </div>
                <button
                    onClick={handleAddBusiness}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Add Business
                </button>
            </div>

            <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg mb-4">Managed Businesses</h3>
                {businesses.length === 0 ? (
                    <p>No businesses found.</p>
                ) : (
                    <ul className="divide-y">
                        {businesses.map((biz) => (
                            <li key={biz.id} className="py-2">
                                <strong>{biz.name || 'Unnamed Business'}</strong>
                                {biz.email ? ` — ${biz.email}` : ''}
                                {biz.phone ? ` | ${biz.phone}` : ''}
                            </li>
                        ))}


                    </ul>
                )}
            </div>
        </div>
    );
};

export default Businesses;
