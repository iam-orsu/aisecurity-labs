document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    
    // Set welcome message
    const userName = localStorage.getItem('user_name');
    if (userName) {
        document.getElementById('welcomeMessage').textContent = `Welcome, ${userName}`;
    }

    // Load profile data
    loadProfile();

    // Navigation
    const navItems = document.querySelectorAll('.nav-item:not(#logoutBtn)');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Smooth scroll to section
            const targetId = item.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await api.post('/logout', {});
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user_name');
            window.location.href = 'login.html';
        }
    });

    // Leave Application
    const leaveForm = document.getElementById('leaveForm');
    const leaveMessage = document.getElementById('leaveMessage');
    const submitBtn = leaveForm.querySelector('button[type="submit"]');

    leaveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('leaveDate').value;
        const reason = document.getElementById('leaveReason').value;

        submitBtn.disabled = true;
        
        try {
            const response = await api.post('/user/apply-leave', { date, reason });
            
            leaveMessage.textContent = response.message;
            leaveMessage.className = 'status-message status-success';
            leaveMessage.style.display = 'block';
            
            leaveForm.reset();
            
            setTimeout(() => {
                leaveMessage.style.display = 'none';
            }, 5000);
            
        } catch (error) {
            leaveMessage.textContent = error.message || 'Failed to apply for leave';
            leaveMessage.className = 'status-message error-message';
            leaveMessage.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
        }
    });
});

async function loadProfile() {
    try {
        const profile = await api.get('/user/profile');
        
        document.getElementById('profileName').textContent = profile.name;
        document.getElementById('profileEmail').textContent = profile.email;
        document.getElementById('profileDept').textContent = profile.department;
        document.getElementById('profileRole').textContent = profile.role;
        document.getElementById('profileSalary').textContent = `$${profile.salary.toLocaleString()}`;
        
        document.getElementById('leaveBalance').textContent = profile.leaves;
        
    } catch (error) {
        console.error('Failed to load profile:', error);
        if (error.message.includes('expired') || error.message.includes('validate')) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
}
