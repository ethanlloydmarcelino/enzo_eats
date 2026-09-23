import { useState } from 'react'
import { FlagHistory } from './FlagHistory'
import { receiptDate } from '../../orders/receipts.mjs'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useReviewOrder } from '../../orders/useOrders'
import { useAuthStore } from '../../store/useAuthStore'

export const AdminOrderAction = ({ order, flag = false }) => {
  const role = useAuthStore((state) => state.role)
  const mutation = useReviewOrder()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [editVersion, setEditVersion] = useState(undefined)
  if (!['admin', 'super_admin'].includes(role)) return null
  const title = flag
    ? order.flaggedAt
      ? 'Edit flag note'
      : 'Flag completed order'
    : 'Cancel order'
  const submit = () => {
    if (!reason.trim()) {
      setError('Please enter a reason.')
      return
    }
    setError('')
    mutation.mutate(
      flag
        ? { orderId: order.id, flagReason: reason.trim(), expectedUpdatedAt: editVersion }
        : { orderId: order.id, status: 'CANCELLED', decisionNote: reason.trim() },
      {
        onSuccess: () => {
          setOpen(false)
          setReason('')
        },
        onError: (cause) =>
          setError(
            cause?.message?.includes('ORDER_CHANGED_REFRESH')
              ? 'Another admin changed this receipt. Close this editor, refresh the receipt, then reopen Edit flag note.'
              : 'The order could not be updated. Refresh to check whether another admin changed it, then try again.',
          ),
      },
    )
  }
  return (
    <View style={{ gap: 10, marginVertical: 12 }}>
      {flag && order.flaggedAt && (
        <View style={{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 8, gap: 4 }}>
          <Text style={{ color: '#664d03', fontWeight: 'bold' }}>Flagged for review</Text>
          <Text selectable style={{ color: '#664d03' }}>
            {order.flagReason}
          </Text>
          <Text style={{ color: '#664d03' }}>Flagged: {receiptDate(order.flaggedAt)}</Text>
          <FlagHistory order={order} />
        </View>
      )}

      {!open ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setReason(flag ? order.flagReason || '' : '')
            setEditVersion(flag && order.flaggedAt ? order.updatedAt : undefined)
            setError('')
            setOpen(true)
          }}
        >
          <Text style={{ color: '#b42318', fontWeight: 'bold', padding: 10 }}>{title}</Text>
        </Pressable>
      ) : (
        <>
          <Text style={{ color: '#b42318' }}>
            {flag
              ? 'This keeps the order completed and records your explanation for accounting review.'
              : 'This will stop the order and notify the customer. Any refund must be handled separately.'}
          </Text>
          <TextInput
            accessibilityLabel={flag ? 'Reason for flagging order' : 'Cancellation reason'}
            value={reason}
            onChangeText={setReason}
            editable={!mutation.isPending}
            multiline
            maxLength={500}
            placeholder="Reason (required)"
            placeholderTextColor="#666"
            style={{
              backgroundColor: '#fff',
              color: '#111',
              borderColor: '#999',
              borderWidth: 1,
              padding: 12,
              borderRadius: 8,
              minHeight: 70,
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={mutation.isPending || !reason.trim()}
            onPress={submit}
            style={{
              backgroundColor: '#b42318',
              padding: 12,
              borderRadius: 8,
              opacity: mutation.isPending || !reason.trim() ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {mutation.isPending
                ? 'Saving...'
                : flag
                  ? order.flaggedAt
                    ? 'Save note'
                    : 'Confirm flag'
                  : 'Confirm cancellation'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={mutation.isPending}
            onPress={() => {
              setOpen(false)
              setError('')
            }}
          >
            <Text style={{ color: '#777', padding: 8 }}>Keep unchanged</Text>
          </Pressable>
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
          {error}
        </Text>
      )}
    </View>
  )
}
