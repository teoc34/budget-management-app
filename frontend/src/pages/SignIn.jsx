import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignIn = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:5000/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.error || 'Signin failed');
            }
        } catch (err) {
            console.error('Error signing in:', err);
            setError('Signin failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center">Sign In</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="w-full p-3 rounded-md border border-gray-300"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full p-3 rounded-md border border-gray-300"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Sign In
                    </button>
                </form>
                <p className="text-center text-gray-600 mt-4">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-600 hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignIn;
