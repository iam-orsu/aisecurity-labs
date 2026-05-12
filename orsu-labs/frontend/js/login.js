const DEFAULT_EMAIL = 'vamsi@orsuenterprises.com';

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const errorBox = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        errorBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';

        try {
            const res = await api.post('/login', { email, password });

            localStorage.setItem('token', res.token);
            localStorage.setItem('user_name', res.user_name);
            localStorage.setItem('user_email', res.user_email || email);

            if (email.toLowerCase() !== DEFAULT_EMAIL.toLowerCase()) {
                showCelebration(res.user_name, email);
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            errorText.textContent = err.message || 'Login failed.';
            errorBox.style.display = 'flex';

            form.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(0)' }
            ], { duration: 300, easing: 'ease-in-out' });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
});

function showCelebration(name, email) {
    document.getElementById('loginSection').style.display = 'none';

    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
        <div class="celebration-card">
            <span class="icon">🏆</span>
            <h3>ACCESS GRANTED</h3>
            <p class="msg">You successfully extracted credentials and gained unauthorized access to another employee's account.</p>
            <div class="identity">
                Logged in as: <strong>${esc(name)}</strong><br>${esc(email)}
            </div>
            <p class="footnote">Lab 1.1 — Prompt Injection Complete</p>
            <button class="btn btn-primary btn-full mt-2" onclick="window.location.href='dashboard.html'">
                Continue to Dashboard →
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    launchConfetti();
}

function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
    const particles = [];

    for (let i = 0; i < 160; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 8 + 3,
            h: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 3 + 1.5,
            rot: Math.random() * 360,
            rotV: (Math.random() - 0.5) * 8,
            alpha: 1
        });
    }

    let frame = 0;
    const max = 220;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frame++;
        for (const p of particles) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.rot += p.rotV;
            if (frame > max - 70) p.alpha = Math.max(0, p.alpha - 0.018);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        if (frame < max) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
}
