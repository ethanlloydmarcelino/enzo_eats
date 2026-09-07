import { Moon, Sun } from 'lucide-react-native'
import { Pressable, StyleSheet } from 'react-native'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'

export const ThemeToggle = () => {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const colors = useColors(theme)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${nextTheme} mode`}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.muted : 'transparent' },
      ]}
    >
      {theme === 'dark' ? (
        <Sun size={19} color={colors.foreground} />
      ) : (
        <Moon size={19} color={colors.foreground} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
