import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

let activeRequests = 0;
type RequestListener = (count: number) => void;
const listeners = new Set<RequestListener>();

export const onActiveRequestsChange = (fn: RequestListener) => {
  listeners.add(fn);
  fn(activeRequests);
  return () => {
    listeners.delete(fn);
  };
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn(activeRequests));
};

const isSilentRequest = (config?: any) => {
  if (!config) return false;
  return (
    config.silent === true ||
    config.headers?.['X-Silent'] === 'true' ||
    config.headers?.['x-silent'] === 'true'
  );
};

// Request interceptor to attach JWT
api.interceptors.request.use((config) => {
  if (!isSilentRequest(config)) {
    activeRequests++;
    notifyListeners();
  }
  const token = localStorage.getItem('withme_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  if (!isSilentRequest(error.config)) {
    activeRequests = Math.max(0, activeRequests - 1);
    notifyListeners();
  }
  return Promise.reject(error);
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    if (!isSilentRequest(response.config)) {
      activeRequests = Math.max(0, activeRequests - 1);
      notifyListeners();
    }
    return response;
  },
  async (error) => {
    if (!isSilentRequest(error.config)) {
      activeRequests = Math.max(0, activeRequests - 1);
      notifyListeners();
    }
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('withme_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          const newAccessToken = res.data.access_token;
          localStorage.setItem('withme_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('withme_access_token');
          localStorage.removeItem('withme_refresh_token');
          localStorage.removeItem('withme_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
