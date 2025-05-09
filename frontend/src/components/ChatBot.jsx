import { useState } from 'react';

const Chatbot = ({ context }) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Salut! Cu ce te pot ajuta?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { from: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        const res = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input, context }),
        });

        const data = await res.json();
        setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {open ? (
                <div className="w-80 bg-white rounded shadow-lg flex flex-col h-96">
                    <div className="bg-indigo-600 text-white p-3 font-bold">MyBudgetBot</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-2 rounded ${msg.from === 'user' ? 'bg-indigo-100 text-right' : 'bg-gray-100 text-left'}`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 border rounded px-2 text-sm"
                            placeholder="Scrie un mesaj..."
                        />
                        <button
                            onClick={handleSend}
                            className="bg-indigo-600 text-white px-3 rounded text-sm"
                        >Trimite</button>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                    >×</button>
                </div>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="bg-indigo-600 text-white p-3 rounded-full shadow-lg"
                >💬</button>
            )}
        </div>
    );
};

export default Chatbot;
