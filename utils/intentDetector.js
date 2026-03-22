// ══════════════════════════════════════════
//   Intent Detector
//   Reads the user message and returns
//   what the user is trying to do
// ══════════════════════════════════════════

const greetingKeywords = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings',
];

const bookingKeywords = [
    'book', 'appointment', 'schedule', 'meeting', 'reserve', 'slot', 'available times', 'book a time',
];

const ticketKeywords = [
    'ticket', 'issue', 'problem', 'not working', 'broken', 'error', 'complaint',
    'i need help', 'urgent', 'bug', 'fault', 'trouble', 'support request',
];

const faqKeywords = [
    'hour', 'open', 'close', 'location', 'address', 'price', 'cost', 'plan',
    'how much', 'refund', 'cancel', 'contact', 'email', 'phone', 'shipping',
    'delivery', 'return', 'exchange', 'password', 'login', 'account',
];


function detectIntent(message) {
    const msg = message.toLowerCase().trim();

    if (greetingKeywords.some(k => msg.includes(k))) return 'greeting';

    // Yes/No confirmation
    if (msg === 'yes' || msg === 'yes please' || msg === 'confirm' || msg === 'correct') return 'confirm_yes';
    if (msg === 'no'  || msg === 'cancel'     || msg === 'no thanks')                   return 'confirm_no';

    if (bookingKeywords.some(k => msg.includes(k)))  return 'booking';
    if (ticketKeywords.some(k => msg.includes(k)))   return 'ticket';
    if (faqKeywords.some(k => msg.includes(k)))      return 'faq';

    return 'unknown';
}

module.exports = { detectIntent };
