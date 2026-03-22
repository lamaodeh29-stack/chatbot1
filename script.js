
const chatBox   = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn   = document.getElementById('send-btn');

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
    el.innerHTML = '<span></span><span></span><span></span>';
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';
    sendBtn.disabled = true;
    showTyping();

    try {
        const res  = await fetch('/chat', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ message: text }),
        });
        const data = await res.json();
        hideTyping();
        addMessage(data.reply, 'bot');
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
