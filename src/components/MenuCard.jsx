import { Heart, Plus, Star } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const MenuCard = ({ item, width }) => {
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const favorites = useOrderStore((state) => state.favorites)
  const toggleFavorite = useOrderStore((state) => state.toggleFavorite)
  const addToCart = useOrderStore((state) => state.addToCart)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const favorite = favorites.includes(item.id)
  const itemName = item.name[language]

  return (
    <View
      style={[styles.card, { width, backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View
        onLayout={(event) => setFrame(event.nativeEvent.layout)}
        style={[styles.imageFrame, { backgroundColor: colors.muted }]}
      >
        {frame.width > 0 && (
          <Image
            source={item.image}
            resizeMode="cover"
            style={{
              position: 'absolute',
              width: frame.width * 2,
              height: frame.height * 2,
              left: -item.crop.x * frame.width,
              top: -item.crop.y * frame.height,
            }}
          />
        )}
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: colors.card }]}>
            <Text style={[styles.badgeText, { color: colors.foreground }]}>{t(item.badge)}</Text>
          </View>
        )}
        <Pressable
          accessibilityLabel={t(favorite ? 'removeFavorite' : 'addFavorite', { name: itemName })}
          onPress={() => toggleFavorite(item.id)}
          style={[styles.favorite, { backgroundColor: colors.card }]}
        >
          <Heart
            size={18}
            color={favorite ? colors.primary : colors.foreground}
            fill={favorite ? colors.primary : 'transparent'}
          />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={[styles.category, { color: colors.mutedForeground }]}>
              {t(item.category)}
            </Text>
            <Text style={[styles.name, { color: colors.foreground }]}>{itemName}</Text>
          </View>
          <Text style={[styles.price, { color: colors.foreground }]}>${item.price}</Text>
        </View>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {item.description[language]}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.rating}>
            <Star size={14} color={colors.coral} fill={colors.coral} />
            <Text style={[styles.ratingText, { color: colors.foreground }]}>{item.rating}</Text>
          </View>
          <Pressable
            onPress={() => addToCart(item)}
            style={[styles.add, { backgroundColor: colors.primary }]}
          >
            <Plus size={15} color="#fff" />
            <Text style={styles.addText}>{t('add')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { minWidth: 250, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  imageFrame: { width: '100%', aspectRatio: 4 / 3, overflow: 'hidden' },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    elevation: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  favorite: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  content: { padding: 18, minHeight: 220 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  titleCopy: { flex: 1 },
  category: { fontSize: 11, fontWeight: '600' },
  name: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginTop: 4 },
  price: { fontSize: 16, fontWeight: '800' },
  description: { fontSize: 14, lineHeight: 21, marginTop: 10, flex: 1 },
  bottom: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 13, fontWeight: '700' },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  addText: { color: '#fff', fontWeight: '800', fontSize: 13 },
})
