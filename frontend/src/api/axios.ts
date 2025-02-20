import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL_PROD 
    : process.env.REACT_APP_API_URL_DEV,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    timeout: 10000  // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            config.headers['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
        }

        // For blob responses
        if (config.responseType === 'blob') {
            config.headers['Accept'] = '*/*';
        }

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Handle token expiration
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        // Handle rate limiting
        if (error.response?.status === 429) {
            console.error('Rate limit exceeded');
        }

        return Promise.reject(error);
    }
);

export default api;