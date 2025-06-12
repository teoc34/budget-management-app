import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// Animations
import darkAnimation from '../assets/animations/finance.json';
import lightAnimation from '../assets/animations/finance.json';
import spendingAnimation from '../assets/animations/spending.json';
import incomeAnimation from '../assets/animations/income.json';
import contactAnimation from '../assets/animations/contact.json';
import aboutAnimation from '../assets/animations/about.json';

// Initialize scroll animation library (AOS)
AOS.init();

// Dummy data for charts
const dummyData = [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 800 },
    { name: "Mar", value: 600 },
    { name: "Apr", value: 1200 },
];

const Homepage = () => {
    // UI states
    const [darkMode, setDarkMode] = useState(false);
    const [hovered, setHovered] = useState(null);

    // Applies dark mode and sets page title on load/theme change
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.title = "MyBudgetApp | Home";
        document.documentElement.classList.add("scroll-smooth");
    }, [darkMode]);

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>

            {/* --- NAVBAR --- */}
            <nav className={`fixed w-full flex items-center justify-between p-6 z-50 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white bg-opacity-90 backdrop-blur-md'}`}>
                <div className="text-2xl font-bold text-indigo-600">MyBudgetApp</div>
                <div className="hidden md:flex space-x-6">
                    <a href="#spending" className="hover:underline">Spending</a>
                    <a href="#income" className="hover:underline">Income</a>
                    <a href="#about" className="hover:underline">About Us</a>
                    <a href="#contact" className="hover:underline">Contact</a>
                </div>
                <div className="flex space-x-4 items-center">
                    <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 text-sm border rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700">
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    <Link to="/signin" className="px-5 py-2 text-indigo-600 border border-indigo-600 rounded-full hover:bg-indigo-50 dark:text-indigo-400">Sign In</Link>
                    <Link to="/signup" className="px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">Sign Up</Link>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className={`flex flex-col-reverse md:flex-row items-center justify-between pt-32 p-10 flex-grow ${darkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
                <div className="max-w-xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Take Control of Your Finances Today</h1>
                    <p className="text-xl dark:text-white mb-6">
                        Upload your CSV, Excel, or PDF files with one click and let us do the hard work.
                    </p>
                    <div className="flex space-x-4">
                        <Link to="/signup" className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white text-lg font-semibold shadow-md hover:scale-105 transition">🚀 Get Started</Link>
                        <Link to="/upload" className="px-8 py-3 rounded-full border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700">📄 Upload Extract</Link>
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-4">
                    <Lottie animationData={darkMode ? darkAnimation : lightAnimation} loop className="w-full h-auto rounded-lg shadow-md" />
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className={`py-20 px-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16" data-aos="fade-up">
                        Why Choose <span className="text-indigo-600 dark:text-indigo-400">MyBudgetApp?</span>
                    </h2>
                    <div className="grid gap-10 md:grid-cols-3" data-aos="fade-up" data-aos-delay="100">
                        {[
                            {
                                icon: "📄",
                                title: "Easy Bank Extract Upload",
                                text: "Upload your CSV, Excel, or PDF files with one click and let us do the hard work.",
                            },
                            {
                                icon: "📊",
                                title: "Automatic Budget Tracking",
                                text: "See where your money goes, categorize expenses automatically, and stay on top of your budget.",
                            },
                            {
                                icon: "🎨",
                                title: "Beautiful Charts & Reports",
                                text: "Get insights through beautiful graphs and clear analytics. Know your financial health at a glance.",
                            },
                        ].map((feature, i) => (
                            <div key={i} className={`p-8 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm opacity-80">{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SPENDING SECTION --- */}
            < section
                id="spending"
                className={`min-h-fit py-10 px-8 transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
                    }`}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8" data-aos="fade-up">
                    <div className="w-full md:w-1/2">
                        <h2 className="text-4xl font-bold mb-4">Track Your Spending Smarter</h2>
                        <p className="text-lg mb-6">
                            Monitor where your money goes every month and receive AI-powered suggestions on where you can save.
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                                data={dummyData}
                                onMouseEnter={() => setHovered("spending")}
                                onMouseLeave={() => setHovered(null)}
                            >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                        border: '1px solid #e5e7eb',
                                        color: darkMode ? '#f9fafb' : '#111827',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        padding: '0.75rem'
                                    }}
                                    labelStyle={{
                                        color: darkMode ? '#f3f4f6' : '#374151',
                                    }}
                                />
                                <Bar dataKey="value" fill={hovered === "spending" ? "#4f46e5" : "#6366f1"} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2">
                        <Lottie animationData={spendingAnimation} loop className="w-full h-auto" />
                    </div>
                </div>
            </section >

            {/* --- INCOME SECTION --- */}
            < section
                id="income"
                className={`min-h-fit py-10 px-8 transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
                    }`}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8" data-aos="fade-up">
                    <div className="w-full md:w-1/2">
                        <Lottie animationData={incomeAnimation} loop className="w-full h-auto" />
                    </div>
                    <div className="w-full md:w-1/2">
                        <h2 className="text-4xl font-bold mb-4">Visualize Income Streams</h2>
                        <p className="text-lg mb-6">
                            Consolidate income from salary, side hustles, and freelancing into one place with live breakdowns.
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                                data={dummyData}
                                onMouseEnter={() => setHovered("income")}
                                onMouseLeave={() => setHovered(null)}
                            >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                        border: '1px solid #e5e7eb',
                                        color: darkMode ? '#f9fafb' : '#111827',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        padding: '0.75rem'
                                    }}
                                    labelStyle={{
                                        color: darkMode ? '#f3f4f6' : '#374151',
                                    }}
                                />
                                <Bar dataKey="value" fill={hovered === "income" ? "#10b981" : "#34d399"} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section >

            {/* --- ABOUT SECTION --- */}
            < section
                id="about"
                className={`min-h-fit py-10 px-8 transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
                    }`}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8" data-aos="fade-up">
                    <div className="w-full md:w-1/2">
                        <h2 className="text-4xl font-bold mb-4">About MyBudgetApp</h2>
                        <p className="text-lg mb-4">
                            MyBudgetApp was born out of my own need to stay organized financially as a student, freelancer, and future entrepreneur.
                        </p>
                        <p className="text-lg mb-4">
                            I wanted to create something practical, intuitive, and truly helpful — not just for myself, but for other individuals and small business owners who, like me, juggle multiple responsibilities and need a clear view of where their money goes.
                        </p>
                        <p className="text-md">
                            This project reflects my passion for technology, financial clarity, and problem-solving, combining everything I’ve learned so far into one application that empowers users to make smarter financial decisions with confidence.
                        </p>
                    </div>
                    <div className="w-full md:w-1/2">
                        <Lottie animationData={aboutAnimation} loop className="w-full h-auto" />
                    </div>
                </div>
            </section >

            {/* --- CONTACT SECTION --- */}
            < section
                id="contact"
                className={`min-h-fit py-10 px-8 transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
                    }`}>

                <div
                    className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8"
                    data-aos="fade-up"
                >
                    <div className="w-full md:w-1/2">
                        <Lottie
                            animationData={contactAnimation}
                            loop
                            className="w-full h-auto"
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <h2 className="text-4xl font-bold mb-4">Let’s Get in Touch</h2>
                        <p className="text-lg mb-4">
                            Whether you have questions, ideas, or just want to share your thoughts, I’d love to hear from you!
                            This project means a lot to me, and your feedback helps it grow.
                        </p>
                        <p className="text-md">
                            📬 Email us at{" "}
                            <a
                                href="mailto:carateodora21@stud.ase.ro"
                                className="underline text-indigo-600 dark:text-indigo-400"
                            >
                                carateodora21@stud.ase.ro
                            </a>
                        </p>
                    </div>
                </div>
            </section >

            {/* --- FOOTER --- */}
            < footer className="bg-indigo-600 text-white p-6 text-center" >
                <p>&copy; {new Date().getFullYear()} MyBudgetApp. All rights reserved.</p>
            </footer >
        </div >
    );
};

export default Homepage;