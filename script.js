
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const sideAssistant = document.getElementById('side-assistant');

const SUGGESTIONS = [
    { label: '📅 Book time', text: 'I want to book an appointment' },
    { label: '🎫 Report issue', text: 'I have an issue I want to report' },
    { label: '❓ FAQ', text: 'What are your hours?' },
];

function addMessage(text, sender) {
    const msg = document.createElement('div');
    const isCard = sender === 'bot' && (text.includes('📋 Status:') || text.includes('Booking confirmed'));
    msg.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    if (isCard) msg.classList.add('card');
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const el = document.createElement('div');
    el.id = 'typing-indicator';
    el.classList.add('message', 'bot-message', 'typing');
    el.innerHTML = '<span class="typing-label">Nano is typing</span><span class="typing-dots"><span></span><span></span><span></span></span>';
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (sideAssistant) sideAssistant.classList.add('typing-active');
}

function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
    if (sideAssistant) sideAssistant.classList.remove('typing-active');
}

function addSuggestions() {
    const existing = document.getElementById('suggestion-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.id = 'suggestion-bar';
    bar.className = 'suggestion-bar';

    SUGGESTIONS.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = s.label;
        btn.onclick = () => {
            bar.remove();
            userInput.value = s.text;
            sendMessage();
        };
        bar.appendChild(btn);
    });

    chatBox.appendChild(bar);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    const existingSuggestions = document.getElementById('suggestion-bar');
    if (existingSuggestions) existingSuggestions.remove();

    addMessage(text, 'user');
    userInput.value = '';
    sendBtn.disabled = true;

    await new Promise(r => setTimeout(r, 350));
    showTyping();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage }),
        });
        const data = await res.json();
        await new Promise(r => setTimeout(r, 500));
        hideTyping();
        addMessage(data.reply, 'bot');
        addSuggestions();
    } catch {
        hideTyping();
        addMessage("Couldn't reach the server. Please try again.", 'bot');
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
