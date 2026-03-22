// ══════════════════════════════════════════
//   AI Service
//   Uses Claude as a smart fallback when
//   no rule-based intent was detected
// ══════════════════════════════════════════

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();


async function getAIReply(message) {
    const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 300,
        system: `You are a friendly customer service assistant for a small business.
You help customers with general questions.
Keep replies short (2-4 sentences max).
Do NOT make up specific details like prices, hours, or policies.
If you don't know something specific, say so and suggest they contact support.`,
        messages: [
            { role: 'user', content: message }
        ],
    });

    return response.content[0].text;
}


module.exports = { getAIReply };
