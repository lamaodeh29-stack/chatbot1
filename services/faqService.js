// ══════════════════════════════════════════
//   FAQ Service
//   Stores FAQ data and finds the right
//   answer based on the user's message
// ══════════════════════════════════════════

const faqs = [
    {
        keywords: ['hour', 'open', 'close', 'working hours'],
        answer: 'We are open Monday to Friday, 9am to 6pm. We are closed on weekends and public holidays.',
    },
    {
        keywords: ['location', 'address', 'where are you', 'find you'],
        answer: 'We are located at 123 Support Street, Tech City. You can also reach us fully online.',
    },
    {
        keywords: ['price', 'cost', 'plan', 'how much', 'pricing', 'subscription'],
        answer: 'Our plans start at $9/month (Basic), $29/month (Pro), and $79/month (Enterprise). Visit our pricing page for full details.',
    },
    {
        keywords: ['refund', 'money back', 'cancel', 'cancellation'],
        answer: 'We offer a 30-day money-back guarantee. To request a refund, contact our billing team at billing@company.com.',
    },
    {
        keywords: ['contact', 'email', 'phone', 'reach', 'talk to someone'],
        answer: 'You can reach us at support@company.com or call 1-800-SUPPORT (Mon–Fri, 9am–6pm).',
    },
    {
        keywords: ['shipping', 'delivery', 'ship', 'arrive', 'how long'],
        answer: 'Standard shipping takes 3–5 business days. Express shipping (1–2 days) is available at checkout.',
    },
    {
        keywords: ['return', 'exchange', 'send back'],
        answer: 'We accept returns within 30 days of purchase. Items must be unused and in original packaging.',
    },
    {
        keywords: ['password', 'login', 'sign in', 'access', 'account'],
        answer: 'If you are having trouble logging in, click "Forgot Password" on the login page. If the issue persists, contact our support team.',
    },
];


function getFAQReply(message) {
    const msg = message.toLowerCase().trim();

    for (const faq of faqs) {
        for (const keyword of faq.keywords) {
            if (msg.includes(keyword)) return faq.answer;
        }
    }

    return null;
}

module.exports = { getFAQReply };
