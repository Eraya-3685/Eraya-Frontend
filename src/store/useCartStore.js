import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1) => {
        const { items } = get();
        const existing = items.find((item) => item.id === product.id);
        if (existing) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: Math.max(1, item.quantity + qty) }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: qty }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      clearCart: () => set({ items: [] }),

      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
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
