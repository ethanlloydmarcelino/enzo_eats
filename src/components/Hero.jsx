import { ArrowRight, Clock3, MapPin, Sparkles, Star } from 'lucide-react-native'
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'

const heroImage = require('../../assets/images/filipino-rice-meals.png')

export const Hero = ({ onOrder }) => {
  const orderType = useOrderStore((state) => state.orderType)
  const setOrderType = useOrderStore((state) => state.setOrderType)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { width } = useWindowDimensions()
  const wide = width >= 900

  return (
    <View style={styles.outer}>
      <View style={[styles.hero, wide && styles.heroWide, { backgroundColor: colors.lilac }]}>
        <View style={[styles.copy, wide && styles.copyWide]}>
          <View style={[styles.badge, { backgroundColor: `${colors.primary}1f` }]}>
            <Sparkles size={13} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>Personalized for you</Text>
          </View>
          <Text style={[styles.title, wide && styles.titleWide, { color: colors.foreground }]}>
            Your meal.{`\n`}
            <Text style={{ color: colors.primary }}>Ready to order.</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Four satisfying rice meals, one simple online ordering experience.
          </Text>
          <View style={[styles.orderBox, { backgroundColor: colors.card }]}>
            <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
              {['Pickup', 'Delivery'].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setOrderType(type)}
                  style={[styles.tab, orderType === type && { backgroundColor: colors.card }]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: orderType === type ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={onOrder}
              style={[styles.orderButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.orderText}>Order now</Text>
              <ArrowRight size={18} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Clock3 size={16} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>20–30 min</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>2.4 miles</Text>
            </View>
            <View style={styles.metaItem}>
              <Star size={16} color={colors.coral} fill={colors.coral} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>4.9</Text>
            </View>
          </View>
        </View>
        <View style={[styles.imageWrap, wide && styles.imageWide]}>
          <Image
            source={heroImage}
            resizeMode="cover"
            style={styles.image}
            accessibilityLabel="Shomai, chicken, beef, and sisig rice meals"
          />
          <View style={[styles.recommendation, { backgroundColor: colors.card }]}>
            <Text style={[styles.recommendationLabel, { color: colors.primary }]}>
              Recommended for you
            </Text>
            <Text style={[styles.recommendationName, { color: colors.foreground }]}>
              Shomai and Rice
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: { width: '100%', maxWidth: 1280, alignSelf: 'center', padding: 18 },
  hero: { borderRadius: 28, overflow: 'hidden' },
  heroWide: { minHeight: 570, flexDirection: 'row' },
  copy: { paddingHorizontal: 26, paddingVertical: 46 },
  copyWide: { flex: 1.08, justifyContent: 'center', paddingHorizontal: 58 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    marginBottom: 22,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 46, lineHeight: 47, letterSpacing: -2.2, fontWeight: '900' },
  titleWide: { fontSize: 66, lineHeight: 66, letterSpacing: -3.6 },
  subtitle: { fontSize: 17, lineHeight: 26, marginTop: 20, maxWidth: 500 },
  orderBox: {
    marginTop: 28,
    maxWidth: 520,
    padding: 8,
    borderRadius: 16,
    gap: 8,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.10)',
  },
  tabs: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  orderButton: {
    minHeight: 46,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  orderText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  meta: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { fontSize: 13 },
  imageWrap: { height: 360 },
  imageWide: { height: 'auto', flex: 0.92 },
  image: { width: '100%', height: '100%' },
  recommendation: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.14)',
  },
  recommendationLabel: { fontSize: 11, fontWeight: '800' },
  recommendationName: { fontSize: 14, fontWeight: '700', marginTop: 2 },
})
