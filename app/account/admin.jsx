import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { Check, ShieldAlert, X } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { OrderCard } from '../../src/components/account/OrderCard'
import { fonts } from '../../src/fonts'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'
import { orderErrorKey } from '../../src/orders/client'
import { useOrdersAwaitingReview, useReviewOrder } from '../../src/orders/useOrders'

import { AdminOrderAction } from '../../src/components/account/AdminOrderAction'

const ADMIN_ROLES = ['admin', 'super_admin']

const Admin = () => {
  const role = useAuthStore((state) => state.role)
  const status = useAuthStore((state) => state.status)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const { data, isPending, isError, refetch } = useOrdersAwaitingReview()
  const operational = useOrdersAwaitingReview(true)
  const review = useReviewOrder()
  const [notes, setNotes] = useState({})
  const [acting, setActing] = useState(null)
  const [error, setError] = useState('')

  const allowed = ADMIN_ROLES.includes(role)

  // A demoted admin must not keep the console open just because the route was
  // already on screen.
  useEffect(() => {
    if (status === 'signedIn' && !allowed) router.replace('/account')
  }, [status, allowed])

  const decide = (order, approve) => {
    setActing(`${order.id}:${approve}`)
    setError('')
    review.mutate(
      { orderId: order.id, approve, decisionNote: notes[order.id] ?? '' },
      {
        onSuccess: () => setNotes((current) => ({ ...current, [order.id]: '' })),
        onError: (cause) => setError(orderErrorKey(cause)),
        onSettled: () => setActing(null),
      },
    )
  }

  const orders = data ?? []

  return (
    <AccountScreen title={t('adminApprovals')} subtitle={t('adminSubtitle')}>
      {!allowed ? (
        <ActivityIndicator accessibilityLabel={t('authLoading')} color={colors.primary} />
      ) : (
        <>
          <View style={[styles.banner, { backgroundColor: colors.lilac }]}>
            <ShieldAlert size={18} color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.foreground }]}>
              {t('adminLiveNotice')}
            </Text>
          </View>

          {!!error && (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={styles.error}
            >
              {t(error)}
            </Text>
          )}

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
          ) : orders.length === 0 ? (
            <Text style={[styles.empty, styles.spacer, { color: colors.mutedForeground }]}>
              {t('adminEmpty')}
            </Text>
          ) : (
            <View
              accessibilityLiveRegion="polite"
              accessibilityLabel={t('adminQueueCount', { count: orders.length })}
              style={styles.spacer}
            >
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} showCustomer>
                  <View style={[styles.actions, { borderTopColor: colors.border }]}>
                    <TextInput
                      accessibilityLabel={t('adminNoteLabel')}
                      value={notes[order.id] ?? ''}
                      onChangeText={(value) =>
                        setNotes((current) => ({ ...current, [order.id]: value }))
                      }
                      editable={!acting}
                      maxLength={500}
                      placeholder={t('adminNotePlaceholder')}
                      placeholderTextColor={colors.mutedForeground}
                      style={[
                        styles.input,
                        {
                          color: colors.foreground,
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                        },
                      ]}
                    />
                    <View style={styles.buttons}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={!!acting}
                        onPress={() => decide(order, false)}
                        style={[styles.button, styles.deny, { opacity: acting ? 0.5 : 1 }]}
                      >
                        {acting === `${order.id}:false` ? (
                          <ActivityIndicator color="#c43c3c" />
                        ) : (
                          <>
                            <X size={16} color="#c43c3c" />
                            <Text style={[styles.buttonText, { color: '#c43c3c' }]}>
                              {t('adminDeny')}
                            </Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={!!acting}
                        onPress={() => decide(order, true)}
                        style={[
                          styles.button,
                          { backgroundColor: colors.primary, opacity: acting ? 0.5 : 1 },
                        ]}
                      >
                        {acting === `${order.id}:true` ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Check size={16} color="#fff" />
                            <Text style={[styles.buttonText, { color: '#fff' }]}>
                              {t('adminApprove')}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                  <AdminOrderAction order={order} />
                </OrderCard>
              ))}
            </View>
          )}
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            {t('adminInProgress')}
          </Text>
          {operational.isError && <Text style={styles.error}>{t('ordersLoadError')}</Text>}
          {(operational.data ?? []).map((order) => {
            const next = { APPROVED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' }[
              order.status
            ]
            return (
              <OrderCard key={order.id} order={order} showCustomer>
                <Pressable
                  accessibilityRole="button"
                  disabled={review.isPending}
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={() =>
                    review.mutate(
                      { orderId: order.id, status: next },
                      { onError: (cause) => setError(orderErrorKey(cause)) },
                    )
                  }
                >
                  <Text style={[styles.buttonText, { color: '#fff' }]}>{t(`advance${next}`)}</Text>
                </Pressable>
                <AdminOrderAction order={order} />
              </OrderCard>
            )
          })}
        </>
      )}
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: 'flex-start',
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 19 },
  spacer: { marginTop: 20 },
  empty: { fontSize: 14, lineHeight: 21, textAlign: 'center', paddingVertical: 28 },
  retry: { fontSize: 13, fontFamily: fonts.bold, textAlign: 'center' },
  actions: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12, gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
  },
  buttons: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deny: { borderWidth: 1.5, borderColor: '#c43c3c' },
  buttonText: { fontSize: 13, fontFamily: fonts.extraBold },
  error: { color: '#c43c3c', fontSize: 13, lineHeight: 20, marginTop: 12 },
})

export default Admin
