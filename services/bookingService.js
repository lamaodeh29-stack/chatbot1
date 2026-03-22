// ══════════════════════════════════════════
//   Booking Service
//   Handles slot validation, booking
//   creation, and available slot listing
// ══════════════════════════════════════════

const pool = require('../db');


// Get all available slots from the database
async function getAvailableSlots() {
    const result = await pool.query('SELECT day, time FROM available_slots ORDER BY id');
    const slots  = result.rows;

    // Group times under each day
    const grouped = {};
    for (const slot of slots) {
        if (!grouped[slot.day]) grouped[slot.day] = [];
        grouped[slot.day].push(slot.time);
    }

    return grouped;
}


// Format slots into a readable string for the chat
async function formatSlots() {
    const grouped = await getAvailableSlots();
    return Object.entries(grouped)
        .map(([day, times]) => `📅 ${day}: ${times.join(', ')}`)
        .join('\n');
}


// Check if a slot is valid (exists in available_slots)
async function isValidSlot(day, time) {
    const result = await pool.query(
        'SELECT * FROM available_slots WHERE LOWER(day) = LOWER($1) AND LOWER(time) = LOWER($2)',
        [day, time]
    );
    return result.rows.length > 0;
}


// Check if a slot is already booked
async function isSlotTaken(day, time) {
    const result = await pool.query(
        `SELECT * FROM bookings
         WHERE LOWER(day) = LOWER($1)
         AND LOWER(time) = LOWER($2)
         AND status != 'cancelled'`,
        [day, time]
    );
    return result.rows.length > 0;
}


// Create a booking (no day/time yet — user hasn't picked one)
async function createBooking(message) {
    const result = await pool.query(
        `INSERT INTO bookings (message, status)
         VALUES ($1, $2)
         RETURNING *`,
        [message, 'pending']
    );
    const booking = result.rows[0];
    console.log('Booking saved to database:', booking);
    return booking;
}


// Confirm a booking with a specific day and time
async function confirmBooking(bookingId, day, time) {
    // Check slot is valid
    const valid = await isValidSlot(day, time);
    if (!valid) return { success: false, reason: 'invalid_slot' };

    // Check slot is not already taken
    const taken = await isSlotTaken(day, time);
    if (taken) return { success: false, reason: 'slot_taken' };

    // Update the booking with the chosen day and time
    const result = await pool.query(
        `UPDATE bookings
         SET day = $1, time = $2, status = 'confirmed'
         WHERE id = $3
         RETURNING *`,
        [day, time, bookingId]
    );

    const booking = result.rows[0];
    console.log('Booking confirmed:', booking);
    return { success: true, booking };
}


// Get the most recent pending booking
async function getLatestPendingBooking() {
    const result = await pool.query(
        `SELECT * FROM bookings WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1`
    );
    return result.rows[0] || null;
}


module.exports = { createBooking, confirmBooking, formatSlots, getLatestPendingBooking, isValidSlot, isSlotTaken };
