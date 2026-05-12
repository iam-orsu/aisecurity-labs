document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');

    // ── Drag & Drop ──────────────────────────────────────
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) uploadFile(fileInput.files[0]);
        fileInput.value = '';
    });

    // ── Upload File ──────────────────────────────────────
    async function uploadFile(file) {
        const allowed = ['application/pdf', 'text/plain'];
        if (!allowed.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
            alert('Only PDF and TXT files are supported.');
            return;
        }

        // Show uploading indicator
        const indicator = document.createElement('div');
        indicator.className = 'uploading-indicator';
        indicator.innerHTML = '<span class="spin">⏳</span> Analyzing ' + escHtml(file.name) + '...';
        uploadedFiles.appendChild(indicator);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_BASE_URL + '/lab2/upload', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });

            const data = await res.json();
            indicator.remove();

            if (!res.ok) throw new Error(data.detail || 'Upload failed');

            const chip = document.createElement('div');
            chip.className = 'file-chip';
            chip.innerHTML = '<span class="check">✓</span> ' + escHtml(data.filename) +
                ' <span class="chars">' + data.chars_extracted.toLocaleString() + ' chars</span>';
            uploadedFiles.appendChild(chip);

            addMessage('📄 Uploaded: ' + data.filename + ' — ' + data.chars_extracted.toLocaleString() + ' characters extracted.', 'ai', true);

        } catch (err) {
            indicator.remove();
            addMessage('<p style="color:var(--red);">⚠ Upload failed: ' + (err.message || 'Unknown error') + '</p>', 'ai', true);
        }
    }

    // ── Chat ─────────────────────────────────────────────
    function addMessage(content, sender, isHtml = false) {
        const div = document.createElement('div');
        div.className = 'msg msg-' + sender;
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
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n- (.*?)(?=\n|$)/g, '<br>• $1');
        html = html.replace(/\n/g, '<br>');
        return '<p>' + html + '</p>';
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
            const result = await api.post('/lab2/chat', { message });
            hideTyping();
            addMessage(formatResponse(result.response), 'ai', true);
        } catch (error) {
            hideTyping();
            addMessage('<p style="color:var(--red);">⚠ ' + (error.message || 'Connection error') + '</p>', 'ai', true);
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    });

    function escHtml(t) {
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }
});
