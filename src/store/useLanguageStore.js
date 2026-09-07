import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'

const storageKey = 'enzo-language'

export const useLanguageStore = create((set) => ({
  language: 'en',
  hydrateLanguage: async () => {
    const saved = await AsyncStorage.getItem(storageKey)
    if (saved === 'en' || saved === 'tl') set({ language: saved })
  },
  toggleLanguage: () =>
    set((state) => {
      const language = state.language === 'en' ? 'tl' : 'en'
      AsyncStorage.setItem(storageKey, language)
      return { language }
    }),
}))
