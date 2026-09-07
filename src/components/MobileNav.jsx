import { Home, Search, ShoppingBag, Utensils } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const MobileNav = ({ onHome, onMenu, onSearch }) => {
  const setCartOpen = useOrderStore((state) => state.setCartOpen)
  const cart = useOrderStore((state) => state.cart)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const { width } = useWindowDimensions()
  if (width >= 760) return null
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const items = [
    { label: t('home'), Icon: Home, action: onHome },
    { label: t('menu'), Icon: Utensils, action: onMenu },
    { label: t('search'), Icon: Search, action: onSearch },
    {
      label: `${t('bag')}${count ? ` (${count})` : ''}`,
      Icon: ShoppingBag,
      action: () => setCartOpen(true),
    },
  ]
  return (
    <View style={[styles.nav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {items.map(({ label, Icon, action }, index) => (
        <Pressable key={label} onPress={action} style={styles.item}>
          <Icon size={19} color={index === 0 ? colors.primary : colors.mutedForeground} />
          <Text
            style={[styles.label, { color: index === 0 ? colors.primary : colors.mutedForeground }]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 66,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    elevation: 12,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '800' },
})
