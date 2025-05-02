import { useState } from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
            {/* Navbar */}
            <nav className="fixed w-full flex items-center justify-between p-6 bg-white bg-opacity-90 backdrop-blur-md shadow-md z-50 dark:bg-gray-800">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">MyBudgetApp</div>
                <div className="hidden md:flex space-x-6">
                    <a href="#spending" className="relative group">
                        Spending
                        <span className="block h-0.5 max-w-0 bg-indigo-600 transition-all duration-500 group-hover:max-w-full"></span>
                    </a>
                    <a href="#income" className="relative group">
                        Income
                        <span className="block h-0.5 max-w-0 bg-indigo-600 transition-all duration-500 group-hover:max-w-full"></span>
                    </a>
                    <a href="#about" className="relative group">
                        About Us
                        <span className="block h-0.5 max-w-0 bg-indigo-600 transition-all duration-500 group-hover:max-w-full"></span>
                    </a>
                    <a href="#contact" className="relative group">
                        Contact
                        <span className="block h-0.5 max-w-0 bg-indigo-600 transition-all duration-500 group-hover:max-w-full"></span>
                    </a>
                </div>
                <div className="flex space-x-4 items-center">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="px-4 py-2 text-sm border rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700"
                    >
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <Link to="/signin" className="px-5 py-2 text-indigo-600 border border-indigo-600 rounded-full hover:bg-indigo-50 dark:text-indigo-400">Sign In</Link>
                    <Link to="/signup" className="px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="flex flex-col-reverse md:flex-row items-center justify-between pt-32 p-10 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 flex-grow">
                <div className="max-w-xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Take Control of Your Finances Today</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Upload your bank extracts and visualize your spending in seconds. Easy, secure, and powerful.</p>
                    <div className="flex space-x-4">
                        <Link to="/signup" className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white text-lg font-semibold shadow-md hover:scale-105 transition">
                            🚀 Get Started
                        </Link>
                        <Link to="/upload" className="px-8 py-3 rounded-full border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700">
                            📄 Upload Extract
                        </Link>
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-4">
                    <img src="src/assets/58148dfa-3389-4084-8d1e-54026eb1bc6d.png" alt="Finance banner" className="rounded-lg shadow-md" />
                </div>
            </header>

            {/* Features Section */}
            <section className="py-20 bg-gray-100 dark:bg-gray-800" id="features">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Choose MyBudgetApp?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow hover:shadow-lg transition">
                            <h3 className="text-2xl font-semibold mb-4">📄 Easy Bank Extract Upload</h3>
                            <p>Upload your CSV, Excel, or PDF files with one click and let us do the hard work.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow hover:shadow-lg transition">
                            <h3 className="text-2xl font-semibold mb-4">📊 Automatic Budget Tracking</h3>
                            <p>See where your money goes, categorize expenses automatically, and stay on top of your budget.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow hover:shadow-lg transition">
                            <h3 className="text-2xl font-semibold mb-4">🎨 Beautiful Charts & Reports</h3>
                            <p>Get insights through beautiful graphs and clear analytics. Know your financial health at a glance.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-indigo-600 text-white p-6 text-center">
                <p>&copy; {new Date().getFullYear()} MyBudgetApp. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Homepage;
