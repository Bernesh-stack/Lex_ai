import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending and receiving HTTP-only cookies
});

// A flag to prevent multiple refresh calls in parallel
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: automatically attach access token
api.interceptors.request.use(
  (config) => {
    // Dynamic import/access of the Zustand store to avoid circular dependency
    // We get the token directly from the Zustand state at request time
    const { accessToken } = window.__authStore || {};
    
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: handle token expiration and automatic silent retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid refreshing token if it's the login, register or logout route itself
      if (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If refreshing is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint to obtain a new access token
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        // Update the Zustand store using the global handler
        if (window.__authStoreSetToken) {
          window.__authStoreSetToken(accessToken, response.data.user);
        }

        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry the original failed request with the new access token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // If refresh fails, log the user out on the frontend
        if (window.__authStoreLogout) {
          window.__authStoreLogout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
