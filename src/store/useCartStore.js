import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1, color = '', size = '') => {
        const { items } = get();
        const existing = items.find(
          (item) =>
            item.id === product.id &&
            (item.selected_color || '') === (color || '') &&
            (item.selected_size || '') === (size || '')
        );
        if (existing) {
          set({
            items: items.map((item) =>
              item.id === product.id &&
              (item.selected_color || '') === (color || '') &&
              (item.selected_size || '') === (size || '')
                ? { ...item, quantity: Math.max(1, item.quantity + qty) }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: qty, selected_color: color, selected_size: size }] });
        }
      },

      removeItem: (productId, color = '', size = '') => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.id === productId &&
                (item.selected_color || '') === (color || '') &&
                (item.selected_size || '') === (size || '')
              )
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      updateQuantity: (productId, quantity, color = '', size = '') => {
        set({
          items: get().items.map((item) =>
            item.id === productId &&
            (item.selected_color || '') === (color || '') &&
            (item.selected_size || '') === (size || '')
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ),
        });
      },

      syncItems: (updatedItems) => {
        set({ items: updatedItems });
      },

      // Backend uses base_price field
      getTotal: () => {
        return get()
          .items.reduce((total, item) => {
            const price = item.discount_price && item.discount_price > 0 ? item.discount_price : item.base_price;
            return total + price * item.quantity;
          }, 0)
          .toFixed(2);
      },
    }),
    {
      name: 'eraya-cart',
    }
  )
);
export default useCartStore;
