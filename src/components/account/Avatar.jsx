import { StyleSheet, Text, View } from 'react-native'
import { fonts } from '../../fonts'
import { useThemeStore } from '../../store/useThemeStore'
import { useColors } from '../../theme'

const initialsOf = (first, last) =>
  `${(first ?? '').trim().charAt(0)}${(last ?? '').trim().charAt(0)}`.toUpperCase()

export const Avatar = ({ attributes, size = 64 }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const initials = initialsOf(attributes?.given_name, attributes?.family_name)

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials || '·'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontFamily: fonts.black, letterSpacing: 0.5 },
})
