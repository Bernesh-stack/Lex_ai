import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // Default to true so we can check auth state on mount
  error: null,

  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),

  // Set validation or server error
  setError: (error) => set({ error }),

  // Register action
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { accessToken, user } = response.data;
      
      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Login action
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid email or password';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Logout action
  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err);
    } finally {
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Check auth on mount (Silent Refresh)
  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data;
      
      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      // If refresh fails, it means there is no valid refresh token (expected for fresh guests)
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

// Expose internal state and actions to window for Axios interceptors
window.__authStore = useAuthStore.getState();

// Keep window.__authStore in sync with any state updates
useAuthStore.subscribe((state) => {
  window.__authStore = state;
});

// Helper mutator for updating token from axios interceptor
window.__authStoreSetToken = (token, user) => {
  useAuthStore.setState({ accessToken: token, user, isAuthenticated: true });
};

// Helper logout triggers from interceptor on refresh failure
window.__authStoreLogout = () => {
  useAuthStore.getState().logout();
};
