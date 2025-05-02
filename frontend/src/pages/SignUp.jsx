import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard'); // Redirect to dashboard
            } else {
                const data = await res.json();
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            console.error('Error signing up:', err);
            setError('Signup failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        className="w-full p-3 rounded-md border border-gray-300"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
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
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className="w-full p-3 rounded-md border border-gray-300"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Sign Up
                    </button>
                </form>
                <p className="text-center text-gray-600 mt-4">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-indigo-600 hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
