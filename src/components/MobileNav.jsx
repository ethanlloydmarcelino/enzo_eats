import { router } from 'expo-router'
import { NotificationDot } from './account/NotificationDot'
import { Home, Search, ShoppingBag, Utensils, UserRound } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useAuthStore } from '../store/useAuthStore'
import { fonts } from '../fonts'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const MobileNav = ({ onHome, onMenu, onSearch }) => {
  const openAccount = useAuthStore((state) => state.openAccount)
  const user = useAuthStore((state) => state.user)
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
    {
      label: t('account'),
      Icon: UserRound,
      action: () => (user ? router.push('/account') : openAccount()),
    },
  ]
  return (
    <View style={[styles.nav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {items.map(({ label, Icon, action }, index) => (
        <Pressable key={label} onPress={action} style={styles.item}>
          <View style={{ width: 32, height: 24, alignItems: 'center' }}>
            <Icon size={19} color={index === 0 ? colors.primary : colors.mutedForeground} />
            {index === 4 && <NotificationDot />}
          </View>
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
  label: { fontSize: 10, fontFamily: fonts.extraBold },
})
