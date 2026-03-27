// ══════════════════════════════════════════
//   Booking Service
//   Handles slot validation, booking
//   creation, and available slot listing
// ══════════════════════════════════════════

const pool = require('../db');


// ── Schedule constants ──
const WORKING_DAYS       = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const BOOKING_START_HOUR = 7;   // 7:00am
const BOOKING_END_HOUR   = 19;  // 7:00pm

// Convert a 24h hour (7..19) to the app's display format: "7:00am", "12:00pm", "1:00pm"
function hourToSlotString(h) {
    if (h < 12)  return `${h}:00am`;
    if (h === 12) return `12:00pm`;
    return `${h - 12}:00pm`;
}

// All hourly slot strings for the booking window
function generateAllTimeSlots() {
    const slots = [];
    for (let h = BOOKING_START_HOUR; h <= BOOKING_END_HOUR; h++) {
        slots.push(hourToSlotString(h));
    }
    return slots; // ["7:00am","8:00am",...,"7:00pm"]
}

// Parse a time string → total minutes from midnight (-1 on failure)
function timeToMinutes(timeStr) {
    const match = timeStr.toLowerCase().trim().match(/^(\d+):(\d+)(am|pm)$/);
    if (!match) return -1;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3];
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return h * 60 + m;
}

function isWithinBookingHours(timeStr) {
    const mins = timeToMinutes(timeStr);
    return mins >= BOOKING_START_HOUR * 60 && mins <= BOOKING_END_HOUR * 60;
}


// Generate the full Mon–Fri schedule (7am–7pm hourly) then remove confirmed bookings
async function getAvailableSlots() {
    const bookedResult = await pool.query(
        "SELECT LOWER(day) as day, LOWER(time) as time FROM bookings WHERE status = 'confirmed'"
    );
    const booked = new Set(bookedResult.rows.map(r => `${r.day}|${r.time}`));

    const allTimes = generateAllTimeSlots();
    const grouped  = {};

    for (const day of WORKING_DAYS) {
        const available = allTimes.filter(time => {
            const key = `${day.toLowerCase()}|${time.toLowerCase()}`;
            return !booked.has(key);
        });
        if (available.length > 0) grouped[day] = available;
    }
    return grouped;
}


// Format available slots into a readable string for the chat
async function formatSlots() {
    const grouped = await getAvailableSlots();
    return Object.entries(grouped)
        .map(([day, times]) => `📅 ${day}: ${times.join(', ')}`)
        .join('\n');
}


// A slot is valid if: working day + within hours + on the hour (no half-past etc.)
async function isValidSlot(day, time) {
    const isWorkingDay = WORKING_DAYS.some(d => d.toLowerCase() === day.toLowerCase());
    if (!isWorkingDay) return false;

    if (!isWithinBookingHours(time)) return false;

    // Must land exactly on an hour mark (minutes === 0)
    const match = time.toLowerCase().trim().match(/^(\d+):(\d+)(am|pm)$/);
    if (!match || parseInt(match[2]) !== 0) return false;

    return true;
}


// Check if a slot is already taken by a confirmed booking
async function isSlotTaken(day, time) {
    const result = await pool.query(
        `SELECT * FROM bookings
         WHERE LOWER(day) = LOWER($1)
         AND LOWER(time) = LOWER($2)
         AND status = 'confirmed'`,
        [day, time]
    );
    return result.rows.length > 0;
}


// Save a fully confirmed booking — called only after user explicitly confirms
// Nothing is written to the DB before this point
async function confirmBooking(day, time, name, phone, email, message) {
    // Re-validate slot is still valid and not taken
    const valid = await isValidSlot(day, time);
    if (!valid) return { success: false, reason: 'invalid_slot' };

    const taken = await isSlotTaken(day, time);
    if (taken) return { success: false, reason: 'slot_taken' };

    const result = await pool.query(
        `INSERT INTO bookings (message, day, time, status, name, phone, email)
         VALUES ($1, $2, $3, 'confirmed', $4, $5, $6)
         RETURNING *`,
        [message || `${day} ${time}`, day, time, name, phone, email]
    );

    const booking = result.rows[0];
    console.log('Booking confirmed and saved:', booking);
    return { success: true, booking };
}


module.exports = { confirmBooking, formatSlots, isValidSlot, isSlotTaken };
