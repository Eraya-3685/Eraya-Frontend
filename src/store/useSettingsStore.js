import { create } from 'zustand';
import api from '../api/axios';

const useSettingsStore = create((set) => ({
  settings: {
    free_shipping_threshold: 1999,
    standard_delivery_fee: 85,
    tax_percentage: 5,
  },
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/settings');
      set({ settings: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings) => {
    try {
      await api.put('/settings', newSettings);
      set({ settings: newSettings });
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  },
}));

export default useSettingsStore;
