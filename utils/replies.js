// ══════════════════════════════════════════
//   Reply Templates
//   Provides natural variation so the bot
//   doesn't repeat the exact same wording.
//   Use pick(array) to select a random reply.
// ══════════════════════════════════════════

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const greeting = [
    'Hello! Welcome to Nano Support 👋\n\nI can help you with:\n• FAQ (hours, pricing, refunds, shipping)\n• Support ticket\n• Book an appointment\n\nWhat do you need?',
    'Hey! Great to have you here. 😊\n\nI\'m Nano — here to help with:\n• 📅 Booking an appointment\n• 🎫 Raising a support ticket\n• ❓ Common questions\n\nHow can I help?',
    'Hi there! 👋 I\'m Nano, your support assistant.\n\nI can help with:\n• **Appointments** — book a time with us\n• **Support tickets** — report an issue\n• **FAQ** — pricing, refunds, hours, and more\n\nWhat\'s on your mind?',
];

const thanks = [
    "You're welcome! 😊 Let me know if there's anything else I can help with.",
    "Happy to help! Feel free to ask if you need anything else.",
    "Glad I could help. 😊 Is there anything else you'd like to know?",
];

// Use .replace('{slots}', slots) after picking
const bookingStart = [
    'Sure! Here are our available slots:\n\n{slots}\n\nReply with your preferred day and time (e.g. "Friday 10am").',
    'Of course! Here\'s what\'s currently available:\n\n{slots}\n\nWhich day and time works best for you?',
    'Happy to help you book! Here are the open slots:\n\n{slots}\n\nJust let me know which one you\'d like.',
];

const ticketStart = [
    "I'll create a support ticket for you.\n\nFirst, what is your full name?",
    "Sure, let me get that logged for you.\n\nCould I start with your full name?",
    "I'll open a ticket right away.\n\nFirst — what's your full name?",
];

// Shown when booking and ticket are equally likely — asks user to clarify
const clarify = [
    "Just to make sure I help you the right way — are you looking to **book an appointment**, or do you have an **issue to report**?",
    "I want to point you in the right direction — are you here to **book** something, or to **report a problem**?",
    "Could you clarify — are you trying to **make a booking**, or do you need to **report an issue**?",
];

// Use .replace('{slots}', slots) after picking
const slotFallback = [
    'I didn\'t quite catch that. Please reply with a day and time from the list:\n\n{slots}\n\nExample: "Wednesday 2pm"',
    'Let me know which slot works — just reply with a day and time:\n\n{slots}\n\nFor example: "Monday 10am"',
];

const fallback = [
    'I\'m not sure I understood that. Here\'s what I can help with:\n\n📅 **Book an appointment** — say "I want to book"\n🎫 **Report a problem** — say "I have an issue"\n❓ **FAQ** — ask about hours, pricing, refunds, or shipping\n\nWhat would you like help with?',
    'I didn\'t quite get that. You can ask me about:\n\n📅 **Appointments** — say "I want to book"\n🎫 **Issues** — say "I have a problem"\n❓ **Questions** — pricing, hours, refunds, shipping\n\nHow can I help?',
    'Not sure I caught that. Here\'s what Nano can do:\n\n📅 **Book** — schedule an appointment\n🎫 **Ticket** — report an issue or problem\n❓ **FAQ** — hours, pricing, or shipping\n\nWhat do you need?',
];

module.exports = { pick, greeting, thanks, bookingStart, ticketStart, clarify, slotFallback, fallback };
