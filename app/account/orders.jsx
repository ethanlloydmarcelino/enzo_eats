import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { OrderCard } from '../../src/components/account/OrderCard'
import { fonts } from '../../src/fonts'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'
import { isPastOrder, useMyOrders } from '../../src/orders/useOrders'

const Orders = () => {
  const [tab, setTab] = useState('active')
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const { data, isPending, isError, refetch } = useMyOrders()

  const orders = data ?? []
  const shown = orders.filter((order) =>
    tab === 'past' ? isPastOrder(order) : !isPastOrder(order),
  )
  const tabs = [
    { id: 'active', label: t('ordersActive'), count: orders.filter((o) => !isPastOrder(o)).length },
    { id: 'past', label: t('ordersPast'), count: orders.filter(isPastOrder).length },
  ]

  return (
    <AccountScreen title={t('accountOrders')} subtitle={t('ordersSubtitle')}>
      <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
        {tabs.map(({ id, label, count }) => {
          const active = tab === id
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(id)}
              style={[styles.tab, active && { backgroundColor: colors.background }]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {label} ({count})
              </Text>
            </Pressable>
          )
        })}
      </View>

      {isPending ? (
        <ActivityIndicator
          accessibilityLabel={t('authLoading')}
          color={colors.primary}
          style={styles.spacer}
        />
      ) : isError ? (
        <View style={styles.spacer}>
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            {t('ordersLoadError')}
          </Text>
          <Pressable onPress={() => void refetch()}>
            <Text style={[styles.retry, { color: colors.primary }]}>{t('authRetry')}</Text>
          </Pressable>
        </View>
      ) : shown.length === 0 ? (
        <Text style={[styles.empty, styles.spacer, { color: colors.mutedForeground }]}>
          {t(tab === 'past' ? 'ordersEmptyPast' : 'ordersEmptyActive')}
        </Text>
      ) : (
        <View style={styles.spacer}>
          {shown.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      )}
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12 },
  tab: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontFamily: fonts.extraBold },
  spacer: { marginTop: 20 },
  empty: { fontSize: 14, lineHeight: 21, textAlign: 'center', paddingVertical: 28 },
  retry: { fontSize: 13, fontFamily: fonts.bold, textAlign: 'center' },
})

export default Orders
