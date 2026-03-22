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


async function createTicket(message) {
    const priority = detectPriority(message);

    const result = await pool.query(
        `INSERT INTO tickets (message, status, priority)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [message, 'open', priority]
    );

    const ticket = result.rows[0];
    console.log('Ticket saved to database:', ticket);
    return ticket;
}


module.exports = { createTicket };
