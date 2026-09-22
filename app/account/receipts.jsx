import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { useCompletedOrders } from '../../src/orders/useOrders'
import { completedAt, receiptDate, receiptMoney } from '../../src/orders/receipts.mjs'
import { printReceipt } from '../../src/orders/printReceipt'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'

export default function Receipts() {
  const { role, status } = useAuthStore()
  const allowed = status === 'signedIn' && ['admin', 'super_admin'].includes(role)
  const colors = useColors(useThemeStore((state) => state.theme))
  const query = useCompletedOrders()
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (status === 'signedIn' && !allowed) router.replace('/account')
  }, [status, allowed])
  const orders = [
    ...new Map(
      (query.data?.pages ?? [])
        .flatMap((page) => page.data ?? [])
        .map((order) => [order.id, order]),
    ).values(),
  ]
  const text = { color: colors.foreground, lineHeight: 22 }
  const button = {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  }
  return (
    <AccountScreen title="Completed orders & receipts" subtitle="Itemized accounting records">
      {allowed && (
        <>
          <Text style={text}>
            Completed orders are saved here automatically. Print an individual receipt or choose
            Save as PDF in the print dialog. Dates use Philippine time.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void query.refetch()}
            style={{ paddingVertical: 16 }}
          >
            <Text style={{ color: colors.primary }}>Refresh orders</Text>
          </Pressable>
          {query.isPending && <ActivityIndicator color={colors.primary} />}
          {query.isError && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              Could not load receipts. Please retry using Refresh orders.
            </Text>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              {error}
            </Text>
          )}
          {!query.isPending && !query.isError && orders.length === 0 && (
            <Text style={text}>No completed orders yet.</Text>
          )}
          {orders.map((order) => (
            <View
              key={order.id}
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                borderRadius: 14,
                marginVertical: 8,
                gap: 8,
              }}
            >
              <Text style={[text, { fontWeight: 'bold', fontSize: 17 }]}>
                {order.orderNumber} | {receiptMoney(order.total, order.currency)}
              </Text>
              <Text style={text}>
                {order.customerFirstName} {order.customerLastName}
              </Text>
              <Text style={text}>Completed: {receiptDate(completedAt(order))}</Text>
              <Text style={text}>
                Payment: {order.paymentMethod} |{' '}
                {order.paymentVerified ? 'Verified' : 'Not verified'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: selected === order.id }}
                onPress={() => setSelected(selected === order.id ? null : order.id)}
              >
                <Text style={{ color: colors.primary, paddingVertical: 8 }}>
                  {selected === order.id ? 'Hide receipt details' : 'View itemized receipt'}
                </Text>
              </Pressable>
              {selected === order.id && (
                <>
                  <Text selectable style={text}>
                    Order ID: {order.id}
                  </Text>
                  <Text style={text}>Ordered: {receiptDate(order.placedAt)}</Text>
                  <Text selectable style={text}>
                    {order.customerEmail}
                    {'\n'}
                    {order.customerPhone}
                    {order.customerAddress ? '\n' + order.customerAddress : ''}
                  </Text>
                  {(order.lines ?? []).map((line, index) => (
                    <View
                      key={index}
                      style={{ borderTopWidth: 1, borderColor: colors.border, paddingVertical: 8 }}
                    >
                      <Text style={[text, { fontWeight: 'bold' }]}>
                        {line.name}
                        {line.option ? ' - ' + line.option : ''}
                      </Text>
                      <Text style={text}>
                        {line.quantity} x {receiptMoney(line.unitPrice, order.currency)} ={' '}
                        {receiptMoney(line.lineTotal, order.currency)}
                      </Text>
                    </View>
                  ))}
                  <Text style={text}>Subtotal: {receiptMoney(order.subtotal, order.currency)}</Text>
                  <Text style={[text, { fontWeight: 'bold' }]}>
                    Total: {receiptMoney(order.total, order.currency)}
                  </Text>
                  {!!order.paymentReference && (
                    <Text selectable style={text}>
                      Payment reference: {order.paymentReference}
                    </Text>
                  )}
                  {!!order.note && <Text style={text}>Customer note: {order.note}</Text>}
                  {!!order.decisionNote && (
                    <Text style={text}>Admin note: {order.decisionNote}</Text>
                  )}
                </>
              )}
              <Pressable
                accessibilityRole="button"
                style={button}
                onPress={() => {
                  setError('')
                  try {
                    printReceipt(order)
                  } catch (cause) {
                    setError(cause.message)
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Print receipt / Save PDF</Text>
              </Pressable>
            </View>
          ))}
          {query.hasNextPage && (
            <Pressable
              accessibilityRole="button"
              disabled={query.isFetchingNextPage}
              style={button}
              onPress={() => void query.fetchNextPage()}
            >
              <Text style={{ color: '#fff' }}>
                {query.isFetchingNextPage ? 'Loading...' : 'Load more completed orders'}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </AccountScreen>
  )
}
