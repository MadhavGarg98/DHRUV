import axios from 'axios';

// Clean base URL: trim whitespace and remove trailing slashes
const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

// If rawBase is empty, fallback to '/api' so local dev proxy works seamlessly
const API_BASE_URL = rawBase || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});


/**
 * Normalizes request URLs to prevent double '/api/api' when baseURL ends with '/api',
 * while ensuring that paths missing '/api' still route correctly to the backend.
 */
function normalizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  let cleanUrl = url.startsWith('/') ? url : `/${url}`;

  // If baseURL already ends with /api (e.g. baseURL = '/api' or 'https://.../api')
  if (API_BASE_URL.endsWith('/api')) {
    if (cleanUrl.startsWith('/api/')) {
      return cleanUrl.replace(/^\/api/, '');
    }
    if (cleanUrl === '/api') {
      return '';
    }
    return cleanUrl;
  }

  // If baseURL does NOT end with /api (e.g. baseURL = 'https://dhruv-40xa.onrender.com')
  // Ensure the route starts with /api
  if (!cleanUrl.startsWith('/api/') && cleanUrl !== '/api') {
    return `/api${cleanUrl}`;
  }

  return cleanUrl;
}


api.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = normalizeUrl(config.url);
    }

    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user-id');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


export default api;