import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'
import { create } from 'zustand'

const storageKey = 'enzo-theme'
const systemTheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'

export const useThemeStore = create((set) => ({
  theme: systemTheme,
  hydrateTheme: async () => {
    const saved = await AsyncStorage.getItem(storageKey)
    if (saved === 'light' || saved === 'dark') set({ theme: saved })
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark'
      AsyncStorage.setItem(storageKey, theme)
      return { theme }
    }),
}))
