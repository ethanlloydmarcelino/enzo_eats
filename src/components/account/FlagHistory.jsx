import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/useAuthStore'
import { resolveFlagActors } from '../../orders/resolveFlagActors'
import { Pressable, Text, View } from 'react-native'
import { flagHistory, flagActor } from '../../orders/flagHistory.mjs'
import { receiptDate } from '../../orders/receipts.mjs'

export const FlagHistory = ({ order }) => {
  const [expanded, setExpanded] = useState(false)
  const { user, role, status } = useAuthStore()
  const names = useQuery({
    queryKey: ['flag-actors', user?.userId, role, order.id, order.updatedAt],
    queryFn: () => resolveFlagActors(order),
    enabled: status === 'signedIn' && ['admin', 'super_admin'].includes(role),
    staleTime: 60000,
  })
  const events = flagHistory(order, names.data)
  const original = events.find((event) => event.type === 'ORDER_FLAGGED')
  const edited = [...events].reverse().find((event) => event.type === 'ORDER_FLAG_NOTE_UPDATED')
  const text = { color: '#664d03', fontSize: 12, lineHeight: 19 }
  return (
    <View style={{ gap: 6, marginTop: 8 }}>
      {!!original && (
        <Text selectable style={text}>
          Flagged by: {flagActor(original)}
        </Text>
      )}
      {!!edited && (
        <Text selectable style={text}>
          Last edited by: {flagActor(edited)}
          {'\n'}
          {receiptDate(edited.at)}
        </Text>
      )}
      {names.isError && (
        <Text style={text} onPress={() => names.refetch()}>
          Unable to load names. Tap to retry.
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={{ paddingVertical: 8 }}
      >
        <Text style={[text, { fontWeight: 'bold' }]}>
          {expanded ? 'Hide' : 'View'} flag history ({events.length})
        </Text>
      </Pressable>
      {expanded &&
        events.map((event, index) => (
          <View
            key={index}
            style={{ gap: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#dcc792' }}
          >
            <Text style={[text, { fontWeight: 'bold' }]}>
              {event.type === 'ORDER_FLAGGED' ? 'Order flagged' : 'Flag note edited'}
            </Text>
            <Text selectable style={text}>
              {flagActor(event)}
            </Text>
            <Text style={text}>{receiptDate(event.at)}</Text>
            {event.previousNote !== undefined && (
              <Text selectable style={text}>
                Previous note: {event.previousNote}
              </Text>
            )}
            <Text selectable style={text}>
              {event.type === 'ORDER_FLAGGED' ? 'Note' : 'Updated note'}:{' '}
              {event.note ?? 'Not recorded'}
            </Text>
          </View>
        ))}
    </View>
  )
}
