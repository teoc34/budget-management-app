const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/chat', async (req, res) => {
    const { message, context } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: context },
                { role: 'user', content: message },
            ],
        });

        const reply = response.choices[0].message.content;
        res.json({ reply });
    } catch (err) {
        console.error('❌ Chatbot error:', err.message);
        res.status(500).json({ error: 'OpenAI error' });
    }
});

module.exports = router;
