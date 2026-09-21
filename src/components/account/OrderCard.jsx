import { StyleSheet, Text, View } from 'react-native'
import { fonts } from '../../fonts'
import { useThemeStore } from '../../store/useThemeStore'
import { useColors } from '../../theme'
import { useTranslations } from '../../translations'

export const statusLabelKeys = {
  AWAITING_APPROVAL: 'statusAwaiting',
  APPROVED: 'statusApproved',
  DENIED: 'statusDenied',
  PREPARING: 'statusPreparing',
  READY: 'statusReady',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
}

const paymentLabelKeys = { CASH: 'payCash', GCASH: 'payGcash' }

// Denial is the one outcome a customer must not miss, so it is the only status
// painted in the error colour; everything in flight shares the brand accent.
const statusColor = (status, colors) => {
  if (status === 'DENIED' || status === 'CANCELLED') return '#c43c3c'
  if (status === 'AWAITING_APPROVAL') return colors.coral
  return colors.primary
}

const formatDate = (value, language) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString(language === 'tl' ? 'fil-PH' : 'en-PH', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export const OrderCard = ({ order, showCustomer = false, children }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const accent = statusColor(order.status, colors)

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headRow}>
        <View style={styles.headCopy}>
          <Text style={[styles.number, { color: colors.foreground }]}>{order.orderNumber}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {formatDate(order.placedAt, language)}
          </Text>
        </View>
        <View style={[styles.status, { backgroundColor: `${accent}1a`, borderColor: accent }]}>
          <Text style={[styles.statusText, { color: accent }]}>
            {t(statusLabelKeys[order.status] ?? order.status)}
          </Text>
        </View>
      </View>

      {showCustomer && (
        <View style={[styles.customer, { borderTopColor: colors.border }]}>
          <Text style={[styles.customerName, { color: colors.foreground }]}>
            {order.customerFirstName} {order.customerLastName}
          </Text>
          <Text selectable style={[styles.meta, { color: colors.mutedForeground }]}>
            {order.customerPhone} · {order.customerEmail}
          </Text>
          {!!order.customerAddress && (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {order.customerAddress}
            </Text>
          )}
        </View>
      )}

      <View style={[styles.lines, { borderTopColor: colors.border }]}>
        {(order.lines ?? []).map((line, index) => (
          <View key={`${line.menuId}-${line.option ?? ''}-${index}`} style={styles.line}>
            <Text style={[styles.lineName, { color: colors.foreground }]}>
              {line.quantity}× {line.name}
              {line.option ? ` · ${line.option}` : ''}
            </Text>
            <Text style={[styles.lineTotal, { color: colors.mutedForeground }]}>
              ₱{Number(line.lineTotal).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerRow}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {t(paymentLabelKeys[order.paymentMethod] ?? order.paymentMethod)}
            {order.paymentVerified ? ` · ${t('paymentVerified')}` : ''}
          </Text>
          <Text style={[styles.total, { color: colors.foreground }]}>
            ₱{Number(order.total).toFixed(2)}
          </Text>
        </View>
        {!!order.paymentReference && (
          <Text selectable style={[styles.meta, { color: colors.mutedForeground }]}>
            {t('referenceNumber')}: {order.paymentReference}
          </Text>
        )}
        {!!order.decisionNote && (
          <Text style={[styles.note, { color: colors.foreground }]}>
            {t('adminNote')}: {order.decisionNote}
          </Text>
        )}
      </View>

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, marginBottom: 14 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headCopy: { flex: 1, gap: 2 },
  number: { fontSize: 15, fontFamily: fonts.extraBold, letterSpacing: -0.2 },
  meta: { fontSize: 12, lineHeight: 18 },
  status: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: fonts.extraBold, letterSpacing: 0.3 },
  customer: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12, gap: 2 },
  customerName: { fontSize: 14, fontFamily: fonts.extraBold },
  lines: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12, gap: 6 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineName: { flex: 1, fontSize: 13 },
  lineTotal: { fontSize: 13 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12, gap: 4 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  total: { fontSize: 17, fontFamily: fonts.black },
  note: { fontSize: 12, lineHeight: 18, marginTop: 2 },
})
