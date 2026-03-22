// ══════════════════════════════════════════
//   Customer Service Chatbot — server.js
//   Entry point — starts the server
// ══════════════════════════════════════════

const express   = require('express');
const cors      = require('cors');
const chatRoute = require('./routes/chat');

const app  = express();
const PORT = 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ── Routes ──
app.use('/chat', chatRoute);

// ── Start Server ──
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
