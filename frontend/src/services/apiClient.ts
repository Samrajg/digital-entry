import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Bearer token or X-User-Id dynamically from localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        config.headers['Authorization'] = `Bearer ${storedToken}`;
      } else {
        // Fallback for transition if backend not fully updated yet
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user && user.user_id) {
              config.headers['X-User-Id'] = user.user_id.toString();
            }
          } catch (e) {
            console.error('Error parsing user session for X-User-Id header:', e);
          }
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('sessionExpired');
        window.dispatchEvent(event);
      }
    }
    return Promise.reject(error);
  }
);
