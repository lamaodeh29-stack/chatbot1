// ══════════════════════════════════════════
//   Ticket Service
//   Creates support tickets and saves
//   them to the database
// ══════════════════════════════════════════

const pool = require('../db');


// Detect priority based on message content
function detectPriority(message) {
    const msg = message.toLowerCase();
    if (msg.includes('urgent') || msg.includes('emergency') || msg.includes('critical')) return 'urgent';
    if (msg.includes('important') || msg.includes('asap') || msg.includes('broken')) return 'high';
    if (msg.includes('when you can') || msg.includes('no rush')) return 'low';
    return 'medium';
}


// Create a ticket — called only after user details are collected
async function createTicket(message, name, phone, email) {
    const priority = detectPriority(message);

    const result = await pool.query(
        `INSERT INTO tickets (message, status, priority, name, phone, email)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [message, 'open', priority, name, phone, email]
    );

    const ticket = result.rows[0];
    console.log('Ticket saved to database:', ticket);
    return ticket;
}


module.exports = { createTicket };
