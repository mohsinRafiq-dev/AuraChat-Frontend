import axios from 'axios';

/**
 * In dev, use same-origin `/api` so Vite can proxy to the backend (see `vite.config.js`).
 * Set `VITE_API_URL` when the API is on another host (e.g. production).
 */
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'http://localhost:4000');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let token = null;

api.setToken = (newToken) => {
  token = newToken;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
