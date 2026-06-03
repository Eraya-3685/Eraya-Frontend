import { create } from 'zustand';
import api, { getImageUrl } from '../api/axios';

const CACHE_KEY = 'eraya_settings';

function updateFavicon(logoUrl) {
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.rel = 'icon';
  link.href = logoUrl ? getImageUrl(logoUrl) : '/favicon.png?v=2';
  document.head.appendChild(link);
}

function loadCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

const cached = loadCached();
if (cached?.logo_url) updateFavicon(cached.logo_url);

const useSettingsStore = create((set) => ({
  settings: cached || {
    free_shipping_threshold: 1999,
    standard_delivery_fee: 85,
    tax_percentage: 5,
    logo_url: '',
  },
  loading: false,

  fetchSettings: async () => {
    if (useSettingsStore.getState().loading) return;
    set({ loading: true });
    try {
      const response = await api.get('/settings');
      set({ settings: response.data, loading: false });
      saveCache(response.data);
      updateFavicon(response.data?.logo_url);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings) => {
    try {
      await api.put('/settings', newSettings);
      set({ settings: newSettings });
      saveCache(newSettings);
      updateFavicon(newSettings?.logo_url);
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  },
}));

export default useSettingsStore;
