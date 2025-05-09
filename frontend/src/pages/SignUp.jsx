import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                alert(data.error || 'Signup failed');
            }
        } catch (err) {
            console.error('Error signing up:', err);
            alert('Signup error. Check console for details.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 shadow rounded">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" required />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-3 rounded" required />
                    <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border p-3 rounded" required />

                    <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-3 rounded">
                        <option value="user">User</option>
                        <option value="accountant">Accountant</option>
                        <option value="administrator">Administrator</option>
                    </select>

                    <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700">
                        Sign Up
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <Link to="/" className="text-indigo-600 hover:underline">
                        ⬅️ Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
