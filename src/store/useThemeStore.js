import { create } from 'zustand'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem('enzo-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('enzo-theme', theme)
    set({ theme })
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', theme === 'dark')
      window.localStorage.setItem('enzo-theme', theme)
      return { theme }
    }),
}))
