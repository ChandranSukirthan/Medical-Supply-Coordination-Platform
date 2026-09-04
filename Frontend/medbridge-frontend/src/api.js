import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Auto-normalize baseURL so users can enter either with or without /api/v1
if (typeof baseURL === 'string' && baseURL.startsWith('http')) {
  baseURL = baseURL.replace(/\/+$/, '');
  if (!baseURL.endsWith('/api/v1')) {
    if (baseURL.endsWith('/api')) {
      baseURL = `${baseURL}/v1`;
    } else {
      baseURL = `${baseURL}/api/v1`;
    }
  }
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000, // 45 seconds to accommodate Render free-tier cold starts
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear credentials and redirect to login if not already on auth pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
