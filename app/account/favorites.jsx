import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Heart, Plus } from 'lucide-react-native'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { fetchMenu } from '../../src/data/menu'
import { fonts } from '../../src/fonts'
import { useOrderStore } from '../../src/store/useOrderStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'

const Favorites = () => {
  const favorites = useOrderStore((state) => state.favorites)
  const toggleFavorite = useOrderStore((state) => state.toggleFavorite)
  const addToCart = useOrderStore((state) => state.addToCart)
  const setCartOpen = useOrderStore((state) => state.setCartOpen)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const { data: menu, isPending } = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenu,
    refetchInterval: 45 * 60 * 1000,
  })

  const items = (menu ?? []).filter((item) => favorites.includes(item.id))

  const add = (item) => {
    // Items with flavour choices need the picker on the menu, so send those back
    // to the card rather than guessing a flavour here.
    if (item.options?.length) {
      router.replace('/')
      return
    }
    addToCart({ ...item, cartId: `${item.id}`, selectedOption: null })
    setCartOpen(true)
  }

  return (
    <AccountScreen title={t('accountFavorites')} subtitle={t('favoritesSubtitle')}>
      {isPending ? (
        <ActivityIndicator accessibilityLabel={t('authLoading')} color={colors.primary} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Heart size={44} strokeWidth={1.4} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t('favoritesEmptyTitle')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t('favoritesEmptyText')}
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            style={[styles.primary, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryText}>{t('browseMenu')}</Text>
          </Pressable>
        </View>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Image source={item.image} style={styles.image} resizeMode="cover" />
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.name[language]}</Text>
              <Text style={[styles.price, { color: colors.mutedForeground }]}>
                ₱{item.price} · {t(item.category)}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t('add')}
              onPress={() => add(item)}
              style={[styles.iconButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={18} color="#fff" />
            </Pressable>
            <Pressable
              accessibilityLabel={t('removeFavorite', { name: item.name[language] })}
              onPress={() => toggleFavorite(item.id)}
              style={[styles.iconButton, { backgroundColor: colors.muted }]}
            >
              <Heart size={18} color={colors.primary} fill={colors.primary} />
            </Pressable>
          </View>
        ))
      )}
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    marginBottom: 12,
  },
  image: { width: 60, height: 60, borderRadius: 12 },
  copy: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: fonts.extraBold },
  price: { fontSize: 12 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 20, fontFamily: fonts.black, marginTop: 16 },
  emptyText: { fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  primary: { marginTop: 22, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 13 },
  primaryText: { color: '#fff', fontFamily: fonts.extraBold },
})

export default Favorites
