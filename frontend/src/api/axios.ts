import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1/',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor to handle errors globally
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