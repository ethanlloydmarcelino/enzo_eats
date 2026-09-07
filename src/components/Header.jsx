import { Search, ShoppingBag } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Logo } from './Logo'
import { useOrderStore } from '../store/useOrderStore'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const Header = ({ onMenu, onSearch }) => {
  const cart = useOrderStore((state) => state.cart)
  const setCartOpen = useOrderStore((state) => state.setCartOpen)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const { width } = useWindowDimensions()
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.inner}>
        <Logo />
        {width >= 760 && (
          <View accessibilityRole="tablist" style={styles.nav}>
            <Pressable onPress={onMenu}>
              <Text style={[styles.navText, { color: colors.mutedForeground }]}>{t('menu')}</Text>
            </Pressable>
            <Text style={[styles.navText, { color: colors.mutedForeground }]}>
              {t('howItWorks')}
            </Text>
            <Text style={[styles.navText, { color: colors.mutedForeground }]}>{t('support')}</Text>
          </View>
        )}
        <View style={styles.actions}>
          {width >= 520 && (
            <Pressable
              accessibilityLabel={t('searchMenu')}
              onPress={onSearch}
              style={styles.iconButton}
            >
              <Search size={19} color={colors.foreground} />
            </Pressable>
          )}
          <ThemeToggle />
          <LanguageToggle />
          <Pressable
            onPress={() => setCartOpen(true)}
            style={[styles.bag, { backgroundColor: colors.ink }]}
          >
            <ShoppingBag size={18} color={colors.cream} />
            {width >= 520 && (
              <Text style={[styles.bagText, { color: colors.cream }]}>{t('myBag')}</Text>
            )}
            {count > 0 && (
              <View style={[styles.count, { backgroundColor: colors.primary }]}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { height: 68, borderBottomWidth: StyleSheet.hairlineWidth, zIndex: 10 },
  inner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    height: '100%',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: { flexDirection: 'row', gap: 28 },
  navText: { fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  bag: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bagText: { fontSize: 14, fontWeight: '700' },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '800' },
})
