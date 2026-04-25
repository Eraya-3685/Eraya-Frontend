import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,

  // POST /users/login → { token, user } — single call, no second /profile needed
  login: async (identifier, password) => {
    set({ loading: true });
    try {
      const response = await api.post('/users/login', { identifier, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, loading: false });
      return user?.role || 'buyer';
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // POST /users/signup
  signup: async (data) => {
    set({ loading: true });
    try {
      await api.post('/users/signup', data);
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const { supabase } = await import('../supabase');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signout failed', err);
    }
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  // GET /users/profile → domain.User
  fetchProfile: async () => {
    // Prevent redundant calls if already loading or user is already set
    if (get().loading || get().user) return;
    
    set({ loading: true });
    try {
      const response = await api.get('/users/profile');
      set({ user: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      // ONLY logout if it's a 401 (Unauthorized)
      // If it's a 500 or network error, keep the token and try again later
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      }
    }
  },

  // PATCH /users/profile → updated domain.User
  // Editable: full_name, phone, address (email is immutable)
  updateProfile: async (data) => {
    set({ loading: true });
    try {
      const response = await api.patch('/users/profile', data);
      set({ user: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // PATCH /users/avatar (multipart/form-data, field: "avatar")
  // Returns { avatar_url: "..." }
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.patch('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const avatarUrl = response.data.avatar_url;
    // Update local user state immediately
    set((state) => ({
      user: state.user ? { ...state.user, avatar_url: avatarUrl } : state.user,
    }));
    return avatarUrl;
  },

  socialLogin: async (data) => {
    set({ loading: true });
    try {
      const response = await api.post('/users/social-login', data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, loading: false });
      return user?.role || 'buyer';
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  requestOTP: async (purpose) => {
    set({ loading: true });
    try {
      await api.post('/users/otp/request', { purpose });
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  secureUpdate: async (data) => {
    set({ loading: true });
    try {
      await api.patch('/users/secure-update', data);
      // If email was changed, the user might need to re-login or profile needs refresh
      // But for now, let's just refresh profile
      await get().fetchProfile();
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true });
    try {
      await api.post('/users/forgot-password', { email });
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  resetPassword: async (data) => {
    set({ loading: true });
    try {
      const response = await api.post('/users/reset-password', data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, loading: false });
      return user?.role || 'buyer';
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));

export default useAuthStore;
