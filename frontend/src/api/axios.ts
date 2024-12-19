import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1/'
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Handle specific error responses
            console.error('API Error:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api;