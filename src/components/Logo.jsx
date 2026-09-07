import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'

export const Logo = ({ compact = false, inverse = false, onPress }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  return (
    <Pressable accessibilityLabel="Enzo Eats home" onPress={onPress} style={styles.logo}>
      <View style={[styles.mark, { backgroundColor: colors.primary }]}>
        <Text style={[styles.markText, { color: colors.cream }]}>E</Text>
      </View>
      {!compact && (
        <Text style={[styles.name, { color: inverse ? '#fff' : colors.ink }]}>
          Enzo <Text style={{ color: colors.primary }}>Eats</Text>
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 17, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.8 },
})
