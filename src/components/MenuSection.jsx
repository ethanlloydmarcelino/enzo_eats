import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react-native'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { categories, fetchMenu } from '../data/menu'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { MenuCard } from './MenuCard'
import { useTranslations } from '../translations'

export const MenuSection = ({ category, setCategory, search, setSearch, searchRef }) => {
  const { data = [], isPending } = useQuery({ queryKey: ['menu'], queryFn: fetchMenu })
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const { width } = useWindowDimensions()
  const cardWidth = width >= 1080 ? '23.5%' : width >= 680 ? '48.5%' : '100%'
  const visible = useMemo(
    () =>
      data.filter((item) => {
        const matchesCategory = category === 'all' || item.category === category
        const optionNames = item.options?.map((option) => option.name[language]).join(' ') ?? ''
        return (
          matchesCategory &&
          `${item.name[language]} ${item.description[language]} ${optionNames}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      }),
    [data, category, language, search],
  )

  return (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <View style={[styles.headingRow, width >= 700 && styles.headingRowWide]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('freshDaily')}</Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>{t('popularDishes')}</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            {t('menuSubtitle')}
          </Text>
        </View>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            ref={searchRef}
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchMenu')}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            returnKeyType="search"
          />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categories.map((name) => {
          const active = category === name
          return (
            <Pressable
              key={name}
              onPress={() => setCategory(name)}
              style={[styles.category, { backgroundColor: active ? colors.primary : colors.muted }]}
            >
              <Text style={[styles.categoryText, { color: active ? '#fff' : colors.foreground }]}>
                {t(name)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
      {isPending ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : visible.length ? (
        <View style={styles.grid}>
          {visible.map((item) => (
            <MenuCard key={item.id} item={item} width={cardWidth} />
          ))}
        </View>
      ) : (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('noDishes')}</Text>
          <Pressable
            onPress={() => {
              setSearch('')
              setCategory('all')
            }}
          >
            <Text style={[styles.clear, { color: colors.primary }]}>{t('clearFilters')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 72,
  },
  headingRow: { gap: 24 },
  headingRowWide: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { marginBottom: 8, fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  heading: { fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1.5 },
  subheading: { fontSize: 15, marginTop: 8 },
  search: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, height: '100%', fontSize: 14, outlineStyle: 'none' },
  categories: { gap: 8, paddingVertical: 28 },
  category: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10 },
  categoryText: { fontSize: 14, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  loader: { paddingVertical: 90 },
  empty: {
    marginTop: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 56,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  clear: { fontSize: 14, fontWeight: '800', marginTop: 10 },
})
