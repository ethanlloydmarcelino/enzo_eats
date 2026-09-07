import { Clock3, Leaf, Sparkles } from 'lucide-react-native'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'

const values = [
  {
    icon: Leaf,
    title: 'Quality ingredients',
    text: 'Thoughtfully sourced and prepared fresh every day.',
  },
  {
    icon: Clock3,
    title: 'Ready when you are',
    text: 'Reliable pickup and delivery without the long wait.',
  },
  {
    icon: Sparkles,
    title: 'Smarter recommendations',
    text: 'Helpful suggestions based on what you actually enjoy.',
  },
]

export const Story = () => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const { width } = useWindowDimensions()
  const wide = width >= 760
  return (
    <View style={[styles.section, { backgroundColor: colors.lilac, borderColor: colors.border }]}>
      <View style={styles.inner}>
        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>THE ENZO STANDARD</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Good food should be simple.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            A focused personal ordering platform with clear choices, quick checkout, and helpful
            recommendations.
          </Text>
        </View>
        <View style={[styles.cards, wide && styles.cardsWide]}>
          {values.map((value) => {
            const Icon = value.icon
            return (
              <View
                key={value.title}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.icon, { backgroundColor: `${colors.primary}1f` }]}>
                  <Icon size={21} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{value.title}</Text>
                <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                  {value.text}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 72,
  },
  intro: { maxWidth: 700 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  title: { fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { fontSize: 17, lineHeight: 27, marginTop: 14 },
  cards: { marginTop: 34, gap: 16 },
  cardsWide: { flexDirection: 'row' },
  card: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 24 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', marginTop: 20 },
  cardText: { fontSize: 14, lineHeight: 22, marginTop: 8 },
})
