import { create } from 'zustand'

export const useOrderStore = create((set) => ({
  orderType: 'Pickup',
  cartOpen: false,
  cart: [],
  favorites: [],
  setOrderType: (orderType) => set({ orderType }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((itemId) => itemId !== id)
        : [...state.favorites, id],
    })),
  addToCart: (item) =>
    set((state) => {
      const found = state.cart.find((entry) => entry.id === item.id)
      return {
        cart: found
          ? state.cart.map((entry) =>
              entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
            )
          : [...state.cart, { ...item, quantity: 1 }],
      }
    }),
  changeQuantity: (id, amount) =>
    set((state) => ({
      cart: state.cart
        .map((entry) => (entry.id === id ? { ...entry, quantity: entry.quantity + amount } : entry))
        .filter((entry) => entry.quantity > 0),
    })),
  clearCart: () => set({ cart: [] }),
}))
