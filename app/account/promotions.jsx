import { Tag } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { fonts } from '../../src/fonts'
import { PAYPAL_MINIMUM } from '../../src/checkout/rules'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'

// Standing offers, not a promo-code engine. When promotions become data, this
// list is the only thing that has to change.
const promotions = [
  { id: 'pickup', titleKey: 'promoPickupTitle', bodyKey: 'promoPickupBody' },
  { id: 'gcash', titleKey: 'promoGcashTitle', bodyKey: 'promoGcashBody' },
]

const Promotions = () => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()

  return (
    <AccountScreen title={t('accountPromotions')} subtitle={t('promotionsSubtitle')}>
      {promotions.map(({ id, titleKey, bodyKey }) => (
        <View
          key={id}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.lilac }]}>
            <Tag size={18} color={colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.foreground }]}>{t(titleKey)}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              {t(bodyKey, { amount: PAYPAL_MINIMUM })}
            </Text>
          </View>
        </View>
      ))}
      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        {t('promotionsNote')}
      </Text>
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    marginBottom: 12,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontFamily: fonts.extraBold },
  body: { fontSize: 13, lineHeight: 20 },
  footnote: { fontSize: 12, lineHeight: 18, marginTop: 10, textAlign: 'center' },
})

export default Promotions
