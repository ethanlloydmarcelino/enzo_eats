import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'
import { saveAccountPreferences } from '../orders/preferences'

export const useOrderStore = create((set, get) => ({
  cartOpen: false,
  cart: [],
  favorites: [],
  preferencesOwner: null,
  preferencesReady: false,
  preferencesError: false,
  paymentMethod: 'cash',
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  toggleFavorite: (id) => {
    const owner = useAuthStore.getState().user?.userId
    if (owner && (!get().preferencesReady || get().preferencesOwner !== owner)) {
      set({ preferencesError: true })
      return
    }
    const previous = get().favorites
    const favorites = previous.includes(id)
      ? previous.filter((item) => item !== id)
      : [...previous, id]
    set({ favorites, preferencesError: false })
    if (owner)
      void saveAccountPreferences(owner, { favoriteIds: favorites }).catch(() => {
        if (get().preferencesOwner === owner && get().favorites === favorites)
          set({ favorites: previous, preferencesError: true })
      })
  },
  addToCart: (item) =>
    set((state) => {
      if (item.available === false) return state
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
  reconcileCart: (menu) =>
    set((state) => ({
      cart: state.cart.flatMap((entry) => {
        const item = menu.find((value) => value.id === entry.id)
        if (!item || item.available === false) return []
        const selectedOption =
          item.options?.find((option) => option.id === entry.selectedOption?.id) ?? null
        if (item.options?.length && !selectedOption) return []
        if (!item.options?.length && entry.selectedOption) return []
        return [{ ...item, cartId: entry.cartId, quantity: entry.quantity, selectedOption }]
      }),
    })),
  clearCart: () => set({ cart: [], paymentMethod: 'cash' }),
}))
