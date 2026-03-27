// ══════════════════════════════════════════
//   Intent Detector
//   Reads the user message and returns
//   what the user is trying to do
// ══════════════════════════════════════════

// Short single-word greetings must use word-boundary matching.
// msg.includes('hi') would match 'shipping', 'hey' matches 'they',
// 'yo' matches 'your', 'sup' matches 'support' — all false positives.
const greetingWordSet = new Set(['hi', 'hey', 'yo', 'sup', 'hello', 'howdy', 'hiya']);

// Multi-word / longer greeting phrases are safe with substring matching.
const greetingPhrases = [
    'good morning', 'good afternoon', 'good evening', 'greetings',
    "what's up", 'whats up', 'good day',
];

// 'ty' is removed — it false-matches 'warranty', 'party', 'pretty', 'city', etc.
const thanksKeywords = [
    'thank you', 'thanks', 'thank u', 'cheers', 'appreciate it', 'much appreciated', 'thx',
];

const bookingKeywords = [
    'book', 'appointment', 'schedule', 'meeting', 'reserve', 'slot', 'available times', 'book a time',
    'i want to book', 'can i book', "i'd like to book", 'id like to book', 'make a booking',
    'make a reservation', 'set up a call', 'set up a meeting', 'make an appointment',
    'need an appointment', 'want to schedule', 'want to meet', 'get a slot', 'available slot',
    'book a session', 'get an appointment', 'set up an appointment', 'i need to book',
    'fix a time', 'arrange a meeting', 'pick a time', 'choose a time',
];

const ticketKeywords = [
    'ticket', 'issue', 'problem', 'not working', 'broken', 'error', 'complaint',
    'i need help', 'bug', 'fault', 'trouble', 'support request',
    "doesn't work", "wont work", "cant login", "can't login", 'unable to',
    'failing', 'locked out', 'not loading', 'keeps crashing', 'not responding',
    'something is wrong', 'something went wrong', 'having an issue', 'having a problem',
    'help me', 'need assistance', 'not functioning', 'report a problem',
    'raise a ticket', 'submit a ticket', 'open a ticket',
];

const faqKeywords = [
    'hour', 'open', 'close', 'location', 'address', 'price', 'cost', 'plan',
    'how much', 'refund', 'cancel', 'contact', 'email', 'phone', 'shipping',
    'delivery', 'return', 'exchange', 'password', 'login', 'account',
    'pricing', 'subscription', 'where are you', 'working hours', 'business hours',
    'do you ship', 'money back', 'get in touch', 'can i return',
];

// Exact-match sets for yes/no — avoids false positives on partial messages
const yesWords = new Set([
    'yes', 'yes please', 'confirm', 'correct', 'yep', 'yeah', 'yup',
    'sure', 'absolutely', 'sounds good', 'that works', 'perfect', 'right',
]);
const noWords = new Set([
    'no', 'cancel', 'no thanks', 'nope', 'nah', 'not right', 'wrong', 'different',
]);


// ── Helpers ──────────────────────────────────────────────────────────────────

// Word-boundary greeting check: splits the message into tokens and tests each
// against the exact-word set, so 'hi' only fires when the user actually typed
// the standalone word "hi" — not as part of "shipping" or "while".
function isGreeting(msg) {
    if (greetingPhrases.some(k => msg.includes(k))) return true;
    const tokens = msg.split(/[\s,!?.;:]+/);
    return tokens.some(t => greetingWordSet.has(t));
}

// Score a message against a keyword list.
// Each matched keyword contributes its word-count as score, so specific
// multi-word phrases ("i want to book" = 4 pts) outweigh generic single
// words ("book" = 1 pt). This lets the highest-confidence intent win when
// a long message touches multiple topics.
function scoreIntent(msg, keywords) {
    let score = 0;
    for (const k of keywords) {
        if (msg.includes(k)) {
            score += k.trim().split(/\s+/).length;
        }
    }
    return score;
}


// ── Main function ─────────────────────────────────────────────────────────────

function detectIntent(message) {
    const msg = message.toLowerCase().trim();

    // Greeting — word-boundary safe check runs first.
    if (isGreeting(msg)) return 'greeting';

    // Yes/No — whole-message exact match only (no substring).
    if (yesWords.has(msg)) return 'confirm_yes';
    if (noWords.has(msg))  return 'confirm_no';

    // Score all remaining intents. Highest score wins.
    const scores = {
        thanks:  scoreIntent(msg, thanksKeywords),
        booking: scoreIntent(msg, bookingKeywords),
        ticket:  scoreIntent(msg, ticketKeywords),
        faq:     scoreIntent(msg, faqKeywords),
    };

    const maxScore = Math.max(...Object.values(scores));

    // Nothing matched — genuine unknown.
    if (maxScore === 0) return 'unknown';

    // Collect all intents that share the top score.
    const topIntents = Object.keys(scores).filter(k => scores[k] === maxScore);

    // Clear single winner.
    if (topIntents.length === 1) return topIntents[0];

    // Booking vs ticket at the same score is genuinely ambiguous —
    // return 'ambiguous' so the route can ask a clarification question.
    if (topIntents.includes('booking') && topIntents.includes('ticket')) {
        return 'ambiguous';
    }

    // All other ties resolved by priority:
    // thanks — short, unambiguous
    // booking — specific feature, phrases are long and precise
    // ticket — catches distress / problem reports
    // faq — broadest catch-all keyword set
    const priority = ['thanks', 'booking', 'ticket', 'faq'];
    return priority.find(p => topIntents.includes(p));
}

module.exports = { detectIntent };
