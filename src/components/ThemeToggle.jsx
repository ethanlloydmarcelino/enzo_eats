import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import { Button } from './ui/button'

export const ThemeToggle = () => {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
    </Button>
  )
}
