// ══════════════════════════════════════════
//   Chat Route — Handles POST /chat
// ══════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { detectIntent } = require('../utils/intentDetector');
const { extractSlot } = require('../utils/slotExtractor');
const { getFAQReply } = require('../services/faqService');
const { createTicket } = require('../services/ticketService');
const {
    confirmBooking,
    formatSlots,
    isValidSlot,
    isSlotTaken,
} = require('../services/bookingService');
const { pick, greeting, thanks, bookingStart, ticketStart, clarify, slotFallback, fallback } = require('../utils/replies');
// ── In-memory state ──
// Nothing is written to the DB until the user explicitly confirms.
//
// pendingBooking: null | {
//   step: 'slot' | 'name' | 'phone' | 'email' | 'confirm',
//   day, time, name, phone, email, originalMessage
// }
//
// pendingTicket: null | {
//   step: 'name' | 'phone' | 'email',
//   message, name, phone, email
// }

let pendingBooking = null;
let pendingTicket  = null;

// Short-term conversation memory — in-process only, never written to DB.
// Tracks just enough to interpret short follow-up replies correctly.
const memory = {
    lastIntent:           null,   // last resolved intent
    awaitingClarification: false, // true after an 'ambiguous' reply was sent
};


router.post('/', async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const msg = message.trim();

    try {

        // ══════════════════════════════════════════
        //  1. TICKET DETAIL COLLECTION
        //  Any message while in this flow = the requested detail value.
        //  Cancel keyword resets the flow.
        // ══════════════════════════════════════════
        if (pendingTicket) {
            const lower = msg.toLowerCase();
            if (lower === 'cancel' || lower === 'quit' || lower === 'stop') {
                pendingTicket = null;
                return res.json({ reply: 'Ticket creation cancelled. How can I help you?' });
            }

            if (pendingTicket.step === 'name') {
                if (msg.length < 2 || /^\d+$/.test(msg)) {
                    return res.json({ reply: "That doesn't look like a valid name. Please enter your full name." });
                }
                pendingTicket.name = msg;
                pendingTicket.step = 'phone';
                return res.json({ reply: 'Thanks! What is your phone number?' });
            }

            if (pendingTicket.step === 'phone') {
                const digits = msg.replace(/\D/g, '');
                if (digits.length < 7) {
                    return res.json({ reply: "That doesn't look like a valid phone number. Please enter your phone number (e.g. 07912345678)." });
                }
                pendingTicket.phone = msg;
                pendingTicket.step = 'email';
                return res.json({ reply: 'And your email address?' });
            }

            if (pendingTicket.step === 'email') {
                if (!msg.includes('@') || msg.indexOf('.', msg.indexOf('@')) === -1) {
                    return res.json({ reply: "That doesn't look like a valid email. Please enter your email address (e.g. you@example.com)." });
                }
                pendingTicket.email = msg;
                const { message: ticketMsg, name, phone, email } = pendingTicket;
                pendingTicket = null;
                const ticket = await createTicket(ticketMsg, name, phone, email);
                return res.json({
                    reply: `Ticket created! ✅\n\n🎫 ID: #${ticket.id}\n⚡ Priority: ${ticket.priority}\n📋 Status: Open\n\nWe will respond within 24 hours.`,
                });
            }
        }


        // ══════════════════════════════════════════
        //  2. BOOKING DETAIL COLLECTION (name / phone / email steps)
        //  Treat the message as the value for the current step.
        //  Cancel keyword resets the flow.
        // ══════════════════════════════════════════
        if (pendingBooking && ['name', 'phone', 'email'].includes(pendingBooking.step)) {
            const lower = msg.toLowerCase();
            if (lower === 'cancel' || lower === 'quit' || lower === 'stop') {
                pendingBooking = null;
                return res.json({ reply: 'Booking cancelled. How can I help you?' });
            }

            if (pendingBooking.step === 'name') {
                if (msg.length < 2 || /^\d+$/.test(msg)) {
                    return res.json({ reply: "That doesn't look like a valid name. Please enter your full name." });
                }
                pendingBooking.name = msg;
                pendingBooking.step = 'phone';
                return res.json({ reply: 'Got it. What is your phone number?' });
            }

            if (pendingBooking.step === 'phone') {
                const digits = msg.replace(/\D/g, '');
                if (digits.length < 7) {
                    return res.json({ reply: "That doesn't look like a valid phone number. Please enter your phone number (e.g. 07912345678)." });
                }
                pendingBooking.phone = msg;
                pendingBooking.step = 'email';
                return res.json({ reply: 'And your email address?' });
            }

            if (pendingBooking.step === 'email') {
                if (!msg.includes('@') || msg.indexOf('.', msg.indexOf('@')) === -1) {
                    return res.json({ reply: "That doesn't look like a valid email. Please enter your email address (e.g. you@example.com)." });
                }
                pendingBooking.email = msg;
                pendingBooking.step = 'confirm';
                const dayFmt = pendingBooking.day.charAt(0).toUpperCase() + pendingBooking.day.slice(1);
                return res.json({
                    reply:
                        `Here's your booking summary:\n\n` +
                        `📅 ${dayFmt} at ${pendingBooking.time}\n` +
                        `👤 ${pendingBooking.name}\n` +
                        `📞 ${pendingBooking.phone}\n` +
                        `📧 ${pendingBooking.email}\n\n` +
                        `Shall I confirm this booking? Reply **yes** to confirm or **no** to cancel.`,
                });
            }
        }


        // ══════════════════════════════════════════
        //  From here: run intent detection
        // ══════════════════════════════════════════
        let intent = detectIntent(message);
        console.log(`User: "${message}" | Intent: ${intent}`);

        // ── Clarification resolver ──
        // If we just asked "booking or ticket?", try to resolve the next message.
        if (memory.awaitingClarification && intent === 'unknown') {
            const lower = msg.toLowerCase().trim();
            const bookingCues = new Set(['booking', 'book', 'appointment', 'slot', 'schedule', 'meeting', 'reserve']);
            const ticketCues  = new Set(['ticket', 'support', 'issue', 'problem', 'help', 'report', 'bug', 'error']);
            if      (bookingCues.has(lower)) intent = 'booking';
            else if (ticketCues.has(lower))  intent = 'ticket';
        }
        if (memory.awaitingClarification && intent !== 'ambiguous') {
            memory.awaitingClarification = false;
        }


        // ══════════════════════════════════════════
        //  3. SLOT SELECTION
        //  Runs before intent checks so "Wednesday 4pm" never falls to fallback.
        //  Merges partial day/time across turns whether or not booking was
        //  explicitly started first.
        // ══════════════════════════════════════════
        if (intent !== 'confirm_yes' && intent !== 'confirm_no' && intent !== 'greeting') {
            const { day, time } = extractSlot(message);

            // Auto-start a slot context when the user sends a partial slot
            // (day or time only) with no prior booking in progress.
            // Guard: only when pendingBooking is completely absent — never
            // overwrite an existing step ('slot', 'confirm', etc.).
            if ((day || time) && intent === 'unknown' && !pendingBooking) {
                pendingBooking = { step: 'slot', originalMessage: msg, day: null, time: null };
            }

            // Merge this turn's extracted values with whatever was already
            // stored in an active slot step.
            const inSlotStep = pendingBooking && pendingBooking.step === 'slot';
            const storedDay  = inSlotStep ? (pendingBooking.day  || null) : null;
            const storedTime = inSlotStep ? (pendingBooking.time || null) : null;
            const effectiveDay  = day  || storedDay;
            const effectiveTime = time || storedTime;

            if (effectiveDay && effectiveTime) {
                const valid = await isValidSlot(effectiveDay, effectiveTime);
                if (!valid) {
                    if (inSlotStep) { pendingBooking.day = null; pendingBooking.time = null; }
                    const slots = await formatSlots();
                    return res.json({ reply: `Sorry, ${effectiveDay} at ${effectiveTime} is not an available slot. Please choose from:\n\n${slots}` });
                }

                const taken = await isSlotTaken(effectiveDay, effectiveTime);
                if (taken) {
                    if (inSlotStep) { pendingBooking.day = null; pendingBooking.time = null; }
                    const slots = await formatSlots();
                    return res.json({ reply: `Sorry, ${effectiveDay} at ${effectiveTime} is already booked. Please choose another:\n\n${slots}` });
                }

                // Both pieces confirmed valid — advance to user-details collection
                const originalMessage = (pendingBooking && pendingBooking.originalMessage) || msg;
                pendingBooking = { step: 'name', day: effectiveDay, time: effectiveTime, originalMessage };
                const dayFmt = effectiveDay.charAt(0).toUpperCase() + effectiveDay.slice(1);
                return res.json({
                    reply:
                        `Great choice — ${dayFmt} at ${effectiveTime}!\n\n` +
                        `To complete your booking, I need a few details.\n\n` +
                        `What is your full name?`,
                });
            }

            // Only one piece present in the CURRENT message — persist it and
            // ask for the missing piece.
            // Guard: (day || time) ensures we only respond when the current
            // message actually contributed something new — not just because
            // stored context makes effectiveDay/effectiveTime look non-null.
            if (inSlotStep && (day || time)) {
                if (effectiveDay && !effectiveTime) {
                    pendingBooking.day = effectiveDay;
                    const dayFmt = effectiveDay.charAt(0).toUpperCase() + effectiveDay.slice(1);
                    return res.json({ reply: `Got it — ${dayFmt}. What time works for you? (e.g. "10am", "2pm")` });
                }
                if (effectiveTime && !effectiveDay) {
                    pendingBooking.time = effectiveTime;
                    return res.json({ reply: `Got it — ${effectiveTime}. Which day works for you? (Monday to Friday)` });
                }
            }
        }


        // ══════════════════════════════════════════
        //  4. GREETING
        // ══════════════════════════════════════════
        if (intent === 'greeting') {
            pendingBooking = null;
            pendingTicket = null;
            memory.awaitingClarification = false;
            memory.lastIntent = 'greeting';
            return res.json({ reply: pick(greeting) });
        }


        // ══════════════════════════════════════════
        //  5. CONFIRM YES
        // ══════════════════════════════════════════
        if (intent === 'confirm_yes') {
            // "yes" while still choosing a slot — re-show available slots
            if (pendingBooking && pendingBooking.step === 'slot') {
                const slots = await formatSlots();
                return res.json({ reply: `Please choose a day and time from the available slots:\n\n${slots}` });
            }
            if (pendingBooking && pendingBooking.step === 'confirm') {
                const { day, time, name, phone, email, originalMessage } = pendingBooking;
                const result = await confirmBooking(day, time, name, phone, email, originalMessage);
                pendingBooking = null;

                if (result.success) {
                    return res.json({
                        reply:
                            `Booking confirmed! ✅\n\n` +
                            `📆 ID: #${result.booking.id}\n` +
                            `📅 ${result.booking.day} at ${result.booking.time}\n` +
                            `👤 ${result.booking.name}\n` +
                            `📞 ${result.booking.phone}\n` +
                            `📧 ${result.booking.email}\n` +
                            `📋 Status: Confirmed\n\n` +
                            `See you then! Let us know if you need anything else.`,
                    });
                }
                if (result.reason === 'slot_taken') {
                    pendingBooking = { step: 'slot' };
                    const slots = await formatSlots();
                    return res.json({ reply: `Sorry, that slot was just taken. Please choose another:\n\n${slots}` });
                }
                if (result.reason === 'invalid_slot') {
                    pendingBooking = { step: 'slot' };
                    const slots = await formatSlots();
                    return res.json({ reply: `Sorry, that slot is not valid. Available slots:\n\n${slots}` });
                }
            }
            return res.json({ reply: 'There is nothing pending to confirm. How can I help you?' });
        }


        // ══════════════════════════════════════════
        //  6. CONFIRM NO
        // ══════════════════════════════════════════
        if (intent === 'confirm_no') {
            if (pendingBooking) {
                pendingBooking = { step: 'slot' };
                const slots = await formatSlots();
                return res.json({ reply: `No problem! Here are the available slots again:\n\n${slots}\n\nReply with a day and time to book.` });
            }
            return res.json({ reply: 'Alright, no problem. How can I help you?' });
        }


        // ══════════════════════════════════════════
        //  7. FAQ
        // ══════════════════════════════════════════
        if (intent === 'faq') {
            memory.lastIntent = 'faq';
            const answer = getFAQReply(message);
            return res.json({ reply: answer });
        }


        // ══════════════════════════════════════════
        //  8. TICKET — start detail collection flow
        // ══════════════════════════════════════════
        if (intent === 'ticket') {
            memory.lastIntent = 'ticket';
            pendingTicket = { message: msg, step: 'name', name: null, phone: null, email: null };
            return res.json({ reply: pick(ticketStart) });
        }


        // ══════════════════════════════════════════
        //  9. BOOKING — start slot selection flow
        //  Seed any day/time already present in the message (e.g. "book friday 2pm")
        // ══════════════════════════════════════════
        if (intent === 'booking') {
            memory.lastIntent = 'booking';
            const { day: seedDay, time: seedTime } = extractSlot(message);
            pendingBooking = {
                step: 'slot',
                originalMessage: msg,
                day: seedDay || null,
                time: seedTime || null,
            };
            const slots = await formatSlots();
            return res.json({ reply: pick(bookingStart).replace('{slots}', slots) });
        }


        // ══════════════════════════════════════════
        //  10. THANKS
        // ══════════════════════════════════════════
        if (intent === 'thanks') {
            memory.lastIntent = 'thanks';
            return res.json({ reply: pick(thanks) });
        }


        // ══════════════════════════════════════════
        //  11. AMBIGUOUS — booking and ticket tied
        //  Ask a clarification instead of guessing.
        // ══════════════════════════════════════════
        if (intent === 'ambiguous') {
            memory.awaitingClarification = true;
            memory.lastIntent = 'ambiguous';
            return res.json({ reply: pick(clarify) });
        }


        // ══════════════════════════════════════════
        //  12. FALLBACK
        // ══════════════════════════════════════════
        if (pendingBooking && pendingBooking.step === 'slot') {
            const slots = await formatSlots();
            return res.json({ reply: pick(slotFallback).replace('{slots}', slots) });
        }
        return res.json({ reply: pick(fallback) });

    } catch (err) {
        console.error('Server error:', err.message);
        return res.status(500).json({ reply: 'Something went wrong. Please try again.' });
    }
});


module.exports = router;
