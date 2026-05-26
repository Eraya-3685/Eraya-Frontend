import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';
import useAuthStore from './useAuthStore';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      
      fetchWishlist: async () => {
        if (!localStorage.getItem('token')) return;
        
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const role = currentUser.role?.toLowerCase();
          if (role === 'admin' || role === 'moderator') {
            return;
          }
        }

        set({ loading: true });
        try {
          const res = await api.get('/wishlist');
          // Important: Backend returns raw product array
          set({ items: res.data || [] });
          console.log('Wishlist loaded from backend:', res.data?.length, 'items');
        } catch (err) {
          console.error('Failed to fetch wishlist', err);
        } finally {
          set({ loading: false });
        }
      },

      syncWishlist: async () => {
        const { items, fetchWishlist } = get();
        const token = localStorage.getItem('token');
        if (!token) return;

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const role = currentUser.role?.toLowerCase();
          if (role === 'admin' || role === 'moderator') {
            return;
          }
        }

        if (items.length > 0) {
          console.log('Syncing local wishlist to backend...');
          try {
            await Promise.all(
              items.map((item) => api.post(`/wishlist/${item.id}`))
            );
            console.log('Wishlist items pushed to backend');
          } catch (err) {
            console.error('Failed to sync wishlist items', err);
          }
        }
        
        // Always fetch at the end to get full database state (or if nothing to sync)
        await fetchWishlist();
      },
      
      toggleWishlist: async (product, isLoggedIn) => {
        const { items } = get();
        const exists = items.find((item) => item.id === product.id);
        
        if (exists) {
          // Remove
          set({ items: items.filter((item) => item.id !== product.id) });
          if (isLoggedIn) {
            try {
              await api.delete(`/wishlist/${product.id}`);
            } catch (err) {
              console.error('Failed to remove from backend wishlist', err);
            }
          }
          return false;
        } else {
          // Add
          set({ items: [...items, product] });
          if (isLoggedIn) {
            try {
              await api.post(`/wishlist/${product.id}`);
            } catch (err) {
              console.error('Failed to add to backend wishlist', err);
            }
          }
          return true;
        }
      },
      
      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },
      
      clearWishlist: async () => {
        set({ items: [] });
        if (localStorage.getItem('token')) {
          try {
            await api.delete('/wishlist');
            console.log('Wishlist cleared in backend');
          } catch (err) {
            console.error('Failed to clear backend wishlist', err);
          }
        }
      },
      
      syncItems: (updatedItems) => {
        set({ items: updatedItems });
      },
    }),
    {
      name: 'eraya-wishlist-storage',
    }
  )
);

export default useWishlistStore;
