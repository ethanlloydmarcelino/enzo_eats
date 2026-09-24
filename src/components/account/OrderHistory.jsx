import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pressable, Text, View } from 'react-native'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { useColors } from '../../theme'
import { resolveFlagActors } from '../../orders/resolveFlagActors'
import { orderHistory, orderAction } from '../../orders/orderHistory.mjs'
import { flagActor } from '../../orders/flagHistory.mjs'
import { receiptDate } from '../../orders/receipts.mjs'

export const OrderHistory = ({ order }) => {
  const [expanded, setExpanded] = useState(false)
  const { user, role, status } = useAuthStore()
  const colors = useColors(useThemeStore((state) => state.theme))
  const allowed = status === 'signedIn' && ['admin', 'super_admin'].includes(role)
  const names = useQuery({
    queryKey: ['flag-actors', user?.userId, role, order.id, order.updatedAt],
    queryFn: () => resolveFlagActors(order),
    enabled: allowed && expanded,
    staleTime: 60000,
  })
  if (!allowed) return null
  const events = orderHistory(order, names.data)
  const text = { color: colors.foreground, fontSize: 13, lineHeight: 20 }
  return (
    <View style={{ gap: 8, marginVertical: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={{ paddingVertical: 8 }}
      >
        <Text style={[text, { fontWeight: 'bold' }]}>
          {expanded ? 'Hide' : 'View'} order activity ({events.length})
        </Text>
      </Pressable>
      {expanded && (
        <>
          {names.isFetching && <Text style={text}>Loading names...</Text>}
          {names.isError && (
            <Pressable accessibilityRole="button" onPress={() => names.refetch()}>
              <Text style={text}>Unable to load names. Tap to retry.</Text>
            </Pressable>
          )}
          {!events.length && <Text style={text}>No activity recorded.</Text>}
          {events.map((event, index) => (
            <View
              key={index}
              style={{
                gap: 4,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingVertical: 10,
              }}
            >
              <Text style={[text, { fontWeight: 'bold' }]}>{orderAction(event)}</Text>
              <Text selectable style={text}>
                {flagActor(event)}
              </Text>
              <Text style={text}>{receiptDate(event.at)}</Text>
              {event.previousNote != null && (
                <Text selectable style={text}>
                  Previous note: {event.previousNote}
                </Text>
              )}
              {!!event.note && (
                <Text selectable style={text}>
                  Note: {event.note}
                </Text>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  )
}
