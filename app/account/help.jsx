import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react-native'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { fonts } from '../../src/fonts'
import { GCASH_NUMBER } from '../../src/checkout/rules'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'

const SUPPORT_EMAIL = 'support@enzoeats.ph'

const faqs = [
  { id: 'reference', qKey: 'faqReferenceQ', aKey: 'faqReferenceA' },
  { id: 'approval', qKey: 'faqApprovalQ', aKey: 'faqApprovalA' },
  { id: 'denied', qKey: 'faqDeniedQ', aKey: 'faqDeniedA' },
  { id: 'pickup', qKey: 'faqPickupQ', aKey: 'faqPickupA' },
]

const Help = () => {
  const [open, setOpen] = useState(null)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()

  return (
    <AccountScreen title={t('accountHelp')} subtitle={t('helpSubtitle')}>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {faqs.map(({ id, qKey, aKey }, index) => {
          const expanded = open === id
          return (
            <View
              key={id}
              style={[
                styles.faq,
                index < faqs.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : id)}
                style={styles.question}
              >
                <Text style={[styles.questionText, { color: colors.foreground }]}>{t(qKey)}</Text>
                {expanded ? (
                  <ChevronUp size={18} color={colors.mutedForeground} />
                ) : (
                  <ChevronDown size={18} color={colors.mutedForeground} />
                )}
              </Pressable>
              {expanded && (
                <Text style={[styles.answer, { color: colors.mutedForeground }]}>
                  {t(aKey, { number: GCASH_NUMBER })}
                </Text>
              )}
            </View>
          )
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        {t('helpContactSection')}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        style={[styles.contact, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.lilac }]}>
          <Mail size={18} color={colors.primary} />
        </View>
        <View style={styles.contactCopy}>
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>{t('helpEmail')}</Text>
          <Text style={[styles.contactHint, { color: colors.mutedForeground }]}>
            {SUPPORT_EMAIL}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void Linking.openURL(`sms:${GCASH_NUMBER.replace(/[^\d+]/g, '')}`)}
        style={[styles.contact, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.lilac }]}>
          <MessageCircle size={18} color={colors.primary} />
        </View>
        <View style={styles.contactCopy}>
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>{t('helpText')}</Text>
          <Text style={[styles.contactHint, { color: colors.mutedForeground }]}>
            {GCASH_NUMBER}
          </Text>
        </View>
      </Pressable>
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  group: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  faq: { paddingHorizontal: 16 },
  question: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  questionText: { flex: 1, fontSize: 14, fontFamily: fonts.extraBold, lineHeight: 20 },
  answer: { fontSize: 13, lineHeight: 20, paddingBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 26,
    marginBottom: 8,
    marginLeft: 4,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    marginBottom: 12,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1, gap: 2 },
  contactTitle: { fontSize: 15, fontFamily: fonts.extraBold },
  contactHint: { fontSize: 12 },
})

export default Help
