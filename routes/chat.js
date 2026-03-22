// ══════════════════════════════════════════
//   Chat Route — Handles POST /chat
// ══════════════════════════════════════════

const express          = require('express');
const router           = express.Router();
const { detectIntent } = require('../utils/intentDetector');
const { extractSlot }  = require('../utils/slotExtractor');
const { getFAQReply }  = require('../services/faqService');
const { createTicket } = require('../services/ticketService');
const {
    createBooking,
    confirmBooking,
    formatSlots,
    getLatestPendingBooking,
} = require('../services/bookingService');
const { getAIReply } = require('../services/aiService');


// ── In-memory state for confirmation step ──
// Stores a proposed slot waiting for user yes/no
let awaitingConfirmation = null;
// { bookingId, day, time }


router.post('/', async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const intent = detectIntent(message);
    console.log(`User: "${message}" | Intent: ${intent}`);

    try {

        // ── Greeting ──
        if (intent === 'greeting') {
            awaitingConfirmation = null;
            return res.json({
                reply: 'Hello! Welcome to Support Assistant 👋\n\nI can help you with:\n• FAQ (hours, pricing, refunds, shipping)\n• Support ticket\n• Book an appointment\n\nWhat do you need?',
            });
        }

        // ── User said YES to confirmation ──
        if (intent === 'confirm_yes') {
            if (!awaitingConfirmation) {
                return res.json({ reply: 'There is nothing pending to confirm. How can I help you?' });
            }

            const { bookingId, day, time } = awaitingConfirmation;
            const result = await confirmBooking(bookingId, day, time);
            awaitingConfirmation = null;

            if (result.success) {
                return res.json({
                    reply: `Booking confirmed! ✅\n\n📆 ID: #${result.booking.id}\n📅 ${result.booking.day} at ${result.booking.time}\n📋 Status: Confirmed\n\nSee you then! Let us know if you need anything else.`,
                });
            }
            if (result.reason === 'slot_taken') {
                const slots = await formatSlots();
                return res.json({ reply: `Sorry, that slot was just taken. Please choose another:\n\n${slots}` });
            }
            if (result.reason === 'invalid_slot') {
                const slots = await formatSlots();
                return res.json({ reply: `Sorry, that slot is not valid. Available slots:\n\n${slots}` });
            }
        }

        // ── User said NO to confirmation ──
        if (intent === 'confirm_no') {
            awaitingConfirmation = null;
            const slots = await formatSlots();
            return res.json({ reply: `No problem! Here are the available slots again:\n\n${slots}\n\nReply with a day and time to book.` });
        }

        // ── FAQ ──
        if (intent === 'faq') {
            const answer = getFAQReply(message);
            return res.json({ reply: answer });
        }

        // ── Ticket ──
        if (intent === 'ticket') {
            const ticket = await createTicket(message);
            return res.json({
                reply: `Ticket created! ✅\n\n🎫 ID: #${ticket.id}\n⚡ Priority: ${ticket.priority}\n📋 Status: Open\n\nWe will respond within 24 hours.`,
            });
        }

        // ── Booking — check if user included a day and time ──
        if (intent === 'booking' || intent === 'unknown') {
            const { day, time } = extractSlot(message);

            // User sent a day + time — ask to confirm
            if (day && time) {
                const pending = await getLatestPendingBooking();

                // Validate slot BEFORE asking to confirm
                const { isValidSlot, isSlotTaken } = require('../services/bookingService');
                const valid = await isValidSlot(day, time);
                if (!valid) {
                    const slots = await formatSlots();
                    return res.json({ reply: `Sorry, ${day} at ${time} is not an available slot. Please choose from:\n\n${slots}` });
                }

                const taken = await isSlotTaken(day, time);
                if (taken) {
                    const slots = await formatSlots();
                    return res.json({ reply: `Sorry, ${day} at ${time} is already booked. Please choose another:\n\n${slots}` });
                }

                if (!pending) {
                    const booking = await createBooking(message);
                    awaitingConfirmation = { bookingId: booking.id, day, time };
                } else {
                    awaitingConfirmation = { bookingId: pending.id, day, time };
                }

                const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1);
                return res.json({
                    reply: `You'd like to book ${dayFormatted} at ${time}. Is that correct?\n\nReply with **yes** to confirm or **no** to pick a different slot.`,
                });
            }

            // User said "book" but no day/time — show slots
            if (intent === 'booking') {
                const booking = await createBooking(message);
                const slots   = await formatSlots();
                return res.json({
                    reply: `Sure! Here are our available slots:\n\n${slots}\n\nReply with your preferred day and time (e.g. "Friday 10am").`,
                });
            }
        }

        // ── Fallback ──
        return res.json({
            reply: "I didn't quite understand that. I can help with:\n\n• Hours, pricing, refunds, shipping\n• 'I have a problem' → support ticket\n• 'I want to book' → appointment",
        });

    } catch (err) {
        console.error('Server error:', err.message);
        return res.status(500).json({ reply: 'Something went wrong. Please try again.' });
    }
});


module.exports = router;
