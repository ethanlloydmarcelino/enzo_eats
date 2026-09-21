import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { Bell, X } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useMyOrders, useOrdersAwaitingReview } from '../../orders/useOrders'
import { useAuthStore } from '../../store/useAuthStore'
import { useTranslations } from '../../translations'

export const OrderNotifications = () => {
  const owner = useAuthStore((state) => state.user?.userId)
  const status = useAuthStore((state) => state.status)
  const { data: mine = [] } = useMyOrders()
  const { data: pending = [] } = useOrdersAwaitingReview()
  const [seen, setSeen] = useState({ owner: null, keys: [] })
  const { t } = useTranslations()
  useEffect(() => {
    let active = true
    if (owner)
      void AsyncStorage.getItem(`order-notices:${owner}`)
        .then((value) => {
          const keys = value ? JSON.parse(value) : []
          if (active) setSeen({ owner, keys: Array.isArray(keys) ? keys : [] })
        })
        .catch(() => {
          if (active) setSeen({ owner, keys: [] })
        })
    return () => {
      active = false
    }
  }, [owner])
  if (status !== 'signedIn' || seen.owner !== owner) return null
  const notices = [
    ...mine
      .filter((order) => ['APPROVED', 'DENIED'].includes(order.status))
      .map((order) => ({ order, admin: false })),
    ...pending.map((order) => ({ order, admin: true })),
  ].filter(({ order, admin }) => !seen.keys.includes(`${order.id}:${order.status}:${admin}`))
  if (!notices.length) return null
  const notice = notices[0]
  const acknowledge = () => {
    const keys = [...seen.keys, `${notice.order.id}:${notice.order.status}:${notice.admin}`].slice(
      -500,
    )
    setSeen({ owner, keys })
    void AsyncStorage.setItem(`order-notices:${owner}`, JSON.stringify(keys)).catch(() => {})
  }
  const key = notice.admin
    ? 'noticeWaiting'
    : notice.order.status === 'DENIED'
      ? 'noticeDenied'
      : 'noticeApproved'
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        bottom: 85,
        left: 16,
        right: 16,
        maxWidth: 600,
        alignSelf: 'center',
        backgroundColor: '#163d2b',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 20,
      }}
    >
      <Bell size={20} color="#fff" />
      <Pressable
        accessibilityRole="button"
        style={{ flex: 1 }}
        onPress={() => {
          acknowledge()
          router.push(notice.admin ? '/account/admin' : '/account/orders')
        }}
      >
        <Text style={{ color: '#fff' }}>{t(key, { number: notice.order.orderNumber })}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dismissNotice')}
        onPress={acknowledge}
      >
        <X size={20} color="#fff" />
      </Pressable>
    </View>
  )
}
