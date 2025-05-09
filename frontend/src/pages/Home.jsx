import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showChat, setShowChat] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        const res = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                context:
                    'You are a friendly assistant for a budget management app. Answer questions about features, pricing, benefits, and how to get started.',
            }),
        });

        const data = await res.json();
        const botMessage = { text: data.reply, sender: 'bot' };
        setMessages((prev) => [...prev, botMessage]);
    };

    useEffect(() => {
        document.title = 'MyBudgetApp | Home';
    }, []);

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
            {/* Navbar */}
            <nav className={`fixed w-full flex items-center justify-between p-6 z-50 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white bg-opacity-90 backdrop-blur-md'}`}>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">MyBudgetApp</div>
                <div className="hidden md:flex space-x-6">
                    <a href="#spending" className="hover:underline">Spending</a>
                    <a href="#income" className="hover:underline">Income</a>
                    <a href="#about" className="hover:underline">About Us</a>
                    <a href="#contact" className="hover:underline">Contact</a>
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
            <header className={`flex flex-col-reverse md:flex-row items-center justify-between pt-32 p-10 flex-grow ${darkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
                <div className="max-w-xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Take Control of Your Finances Today</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                        Upload your bank extracts and visualize your spending in seconds. Easy, secure, and powerful.
                    </p>
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
            <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} id="features">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Choose MyBudgetApp?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: '📄 Easy Bank Extract Upload',
                                text: 'Upload your CSV, Excel, or PDF files with one click and let us do the hard work.',
                            },
                            {
                                title: '📊 Automatic Budget Tracking',
                                text: 'See where your money goes, categorize expenses automatically, and stay on top of your budget.',
                            },
                            {
                                title: '🎨 Beautiful Charts & Reports',
                                text: 'Get insights through beautiful graphs and clear analytics. Know your financial health at a glance.',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className={`p-8 rounded-lg shadow transition hover:shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                            >
                                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                                <p>{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Floating Chat Button */}
            <div className="fixed bottom-4 right-4 z-50">
                {showChat ? (
                    <div className={`w-80 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} text-sm rounded-lg shadow-lg border`}>
                        <div className="flex items-center justify-between px-4 py-2 font-semibold text-indigo-600 dark:text-indigo-300 border-b dark:border-gray-700">
                            <span>MyBudgetApp Assistant</span>
                            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg">
                                ×
                            </button>
                        </div>
                        <div className="h-48 overflow-y-auto px-3 py-2 space-y-2">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
                                    <span
                                        className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'user'
                                            ? 'bg-indigo-100 dark:bg-indigo-600 text-indigo-800 dark:text-white'
                                            : 'bg-gray-100 dark:bg-gray-700'
                                            }`}
                                    >
                                        {msg.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex border-t dark:border-gray-700">
                            <input
                                type="text"
                                placeholder="Write a question..."
                                className="flex-grow px-3 py-2 border-none focus:outline-none bg-transparent text-black dark:text-white"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-indigo-600 text-white px-4 hover:bg-indigo-700 transition rounded-r"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowChat(true)}
                        className="bg-indigo-600 text-white px-4 py-3 rounded-full shadow-md hover:bg-indigo-700 transition flex items-center space-x-2"
                    >
                        <span>💬</span>
                        <span className="hidden sm:inline">Chat</span>
                    </button>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-indigo-600 text-white p-6 text-center">
                <p>&copy; {new Date().getFullYear()} MyBudgetApp. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Homepage;
