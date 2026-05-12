// Configuration
const API_BASE_URL = 'http://localhost:8000/api'; // Direct connection to FastAPI backend

// Utility functions
const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (response.status === 401 && endpoint !== '/login') {
                // Token expired or invalid
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                throw new Error('Session expired. Please log in again.');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// Check authentication status
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'login.html';
    }
}
