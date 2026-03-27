// ══════════════════════════════════════════
//   Customer Service Chatbot — server.js
//   Entry point — starts the server
// ══════════════════════════════════════════
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');

const app = express();
const PORT = 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static('__dirname'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + 'index.html');
});

// ── Routes ──
app.use('/chat', chatRoute);

// ── Start Server ──
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log("OPENAI:", !!process.env.OPENAI_API_KEY);
    console.log("HF:", !!process.env.HF_API_KEY);
});
