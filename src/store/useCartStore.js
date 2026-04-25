import { create } from 'zustand';

const useCartStore = create((set, get) => ({
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

  // Backend uses base_price field
  getTotal: () => {
    return get()
      .items.reduce((total, item) => total + item.base_price * item.quantity, 0)
      .toFixed(2);
  },
}));

export default useCartStore;
