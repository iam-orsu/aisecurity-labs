document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');

    function addMessage(content, sender, isHtml = false) {
        const div = document.createElement('div');
        div.className = `msg msg-${sender}`;
        if (isHtml) {
            div.innerHTML = content;
        } else {
            const p = document.createElement('p');
            p.textContent = content;
            div.appendChild(p);
        }
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'msg msg-ai typing-bubble';
        div.id = 'typingIndicator';
        div.innerHTML = '<div class="typing-anim"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    function formatResponse(text) {
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        // Bullet lists
        html = html.replace(/\n- (.*?)(?=\n|$)/g, '<br>• $1');
        // Remaining newlines
        html = html.replace(/\n/g, '<br>');
        return `<p>${html}</p>`;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;

        addMessage(message, 'user');
        showTyping();

        try {
            const result = await api.post('/chatbot', { message });
            hideTyping();
            addMessage(formatResponse(result.response), 'ai', true);
        } catch (error) {
            hideTyping();
            addMessage(
                '<p style="color:var(--red);">⚠ ' + (error.message || 'Connection error') + '</p>',
                'ai', true
            );
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    });
});
