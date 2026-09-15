import { Leaf } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BrandMark } from './BrandMark'
import { fonts } from '../fonts'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const Logo = ({ compact = false, inverse = false, onPress }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const surface = inverse ? '#111' : colors.background
  return (
    <Pressable accessibilityLabel={t('logoHome')} onPress={onPress} style={styles.logo}>
      <View style={styles.markWrap}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <BrandMark size={18} color={colors.cream} />
        </View>
        <View style={[styles.leaf, { backgroundColor: colors.coral, borderColor: surface }]}>
          <Leaf size={10} color="#fff" strokeWidth={2.75} />
        </View>
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
  markWrap: { width: 36, height: 36 },
  mark: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  leaf: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: -0.8 },
})
