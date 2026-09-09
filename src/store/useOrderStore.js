import { create } from 'zustand'

export const useOrderStore = create((set) => ({
  cartOpen: false,
  cart: [],
  favorites: [],
  setCartOpen: (cartOpen) => set({ cartOpen }),
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((itemId) => itemId !== id)
        : [...state.favorites, id],
    })),
  addToCart: (item) =>
    set((state) => {
      const found = state.cart.find((entry) => entry.cartId === item.cartId)
      return {
        cart: found
          ? state.cart.map((entry) =>
              entry.cartId === item.cartId ? { ...entry, quantity: entry.quantity + 1 } : entry,
            )
          : [...state.cart, { ...item, quantity: 1 }],
      }
    }),
  changeQuantity: (cartId, amount) =>
    set((state) => ({
      cart: state.cart
        .map((entry) =>
          entry.cartId === cartId ? { ...entry, quantity: entry.quantity + amount } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    })),
  clearCart: () => set({ cart: [] }),
}))
