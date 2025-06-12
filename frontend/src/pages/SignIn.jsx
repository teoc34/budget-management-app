import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignIn = () => {
    // Form state for email and password
    const [formData, setFormData] = useState({ email: '', password: '' });

    // Hook for navigation after login
    const navigate = useNavigate();

    // Handle form input changes
    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Handle form submission (POST request to backend)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form reload

        try {
            const res = await fetch('http://localhost:5000/api/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            // Debug logs
            console.log('👉 Response Status:', res.status);
            console.log('👉 Response Body:', data);

            if (res.ok) {
                // Store token and user info in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to dashboard home
                navigate('/dashboard/accounthome');
            } else {
                // Display backend error or fallback message
                alert(data.error || 'Signin failed');
            }

        } catch (err) {
            // Handle fetch/network/server errors
            console.error('Error signing in:', err);
            alert('Signin error. Check console for details.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 shadow rounded">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border p-3 rounded"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full border p-3 rounded"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700"
                    >
                        Sign In
                    </button>
                </form>

                {/* Back to homepage */}
                <div className="mt-6 text-center">
                    <Link to="/" className="text-indigo-600 hover:underline">
                        ⬅️ Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
