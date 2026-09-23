import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { AdminOrderAction } from '../../src/components/account/AdminOrderAction'
import { useCompletedOrders } from '../../src/orders/useOrders'
import { completedAt, receiptDate, receiptMoney } from '../../src/orders/receipts.mjs'
import { receiptSearch } from '../../src/orders/receiptSearch.mjs'
import { printReceipt } from '../../src/orders/printReceipt'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
const emptyFilters = { term: '', from: '', to: '', payment: '', flagged: '' }

const Receipts = () => {
  const { role, status } = useAuthStore()
  const allowed = status === 'signedIn' && ['admin', 'super_admin'].includes(role)
  const colors = useColors(useThemeStore((state) => state.theme))
  const [draft, setDraft] = useState(emptyFilters)
  const [criteria, setCriteria] = useState(emptyFilters)
  const [tokens, setTokens] = useState([undefined])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const query = useCompletedOrders(criteria, tokens.at(-1))
  const orders = query.data?.data ?? []
  const order = orders.find((value) => value.id === selected)
  const text = { color: colors.foreground, lineHeight: 22 }
  const button = { padding: 10, borderRadius: 8, backgroundColor: colors.primary }
  useEffect(() => {
    if (status === 'signedIn' && !allowed) router.replace('/account')
  }, [status, allowed])
  const apply = () => {
    try {
      receiptSearch(draft)
      setCriteria({ ...draft })
      setTokens([undefined])
      setSelected(null)
      setError('')
    } catch (cause) {
      setError(cause.message)
    }
  }
  const print = (order) => {
    setError('')
    try {
      printReceipt(order)
    } catch (cause) {
      setError(cause.message)
    }
  }
  const input = (key, label) => (
    <View style={{ flexGrow: 1, minWidth: 180 }}>
      <Text style={text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={draft[key]}
        onChangeText={(value) => setDraft((current) => ({ ...current, [key]: value }))}
        maxLength={key === 'term' ? 150 : 10}
        autoCapitalize="none"
        placeholderTextColor={colors.mutedForeground}
        placeholder={key === 'term' ? 'Order, customer or reference' : 'YYYY-MM-DD'}
        style={{
          ...text,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 10,
          borderRadius: 8,
        }}
      />
    </View>
  )
  const options = (key, values) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {values.map(([value, label]) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: draft[key] === value }}
          onPress={() => setDraft((current) => ({ ...current, [key]: value }))}
          style={{
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: draft[key] === value ? colors.primary : colors.border,
            backgroundColor: draft[key] === value ? colors.primary : colors.card,
          }}
        >
          <Text style={{ color: draft[key] === value ? '#fff' : colors.foreground }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
  const cell = (value, width) => (
    <View role="cell" style={{ width, padding: 12 }}>
      <Text selectable style={text}>
        {value}
      </Text>
    </View>
  )
  return (
    <AccountScreen title="Completed orders & receipts" subtitle="Searchable accounting archive">
      {allowed && (
        <>
          <Text style={text}>
            Search saved order records. Dates are order dates in Philippine time. Text searches are
            case-sensitive.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 12 }}>
            {input('term', 'Order / customer / payment reference')}
            {input('from', 'Ordered from')}
            {input('to', 'Ordered through')}
          </View>
          <Text style={text}>Payment method</Text>
          {options('payment', [
            ['', 'All payments'],
            ['CASH', 'Cash'],
            ['GCASH', 'GCash'],
          ])}
          <Text style={[text, { marginTop: 12 }]}>Accounting flags</Text>
          {options('flagged', [
            ['', 'All orders'],
            ['flagged', 'Flagged'],
            ['unflagged', 'Not flagged'],
          ])}
          <View style={{ flexDirection: 'row', gap: 10, marginVertical: 16 }}>
            <Pressable accessibilityRole="button" style={button} onPress={apply}>
              <Text style={{ color: '#fff' }}>Search</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={button}
              onPress={() => {
                setDraft(emptyFilters)
                setCriteria(emptyFilters)
                setTokens([undefined])
                setSelected(null)
                setError('')
              }}
            >
              <Text style={{ color: '#fff' }}>Clear filters</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={button}
              onPress={() => void query.refetch()}
            >
              <Text style={{ color: '#fff' }}>Refresh</Text>
            </Pressable>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              {error}
            </Text>
          )}
          {query.isPending && <ActivityIndicator color={colors.primary} />}
          {query.isError && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              Could not load receipts. Select Refresh to retry.
            </Text>
          )}
          <ScrollView horizontal>
            <View
              role="table"
              accessibilityLabel="Completed order receipts"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <View role="row" style={{ flexDirection: 'row', backgroundColor: colors.muted }}>
                {[
                  ['Order', 180],
                  ['Customer', 240],
                  ['Ordered', 210],
                  ['Completed', 210],
                  ['Payment', 110],
                  ['Total', 120],
                  ['Flag', 110],
                  ['Actions', 200],
                ].map(([label, width]) => (
                  <View key={label} role="columnheader" style={{ width, padding: 12 }}>
                    <Text style={[text, { fontWeight: 'bold' }]}>{label}</Text>
                  </View>
                ))}
              </View>
              {orders.map((row) => (
                <View
                  key={row.id}
                  role="row"
                  style={{
                    flexDirection: 'row',
                    borderTopWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: row.id === selected ? colors.muted : colors.card,
                  }}
                >
                  {cell(row.orderNumber, 180)}
                  {cell(
                    row.customerFirstName + ' ' + row.customerLastName + '\n' + row.customerEmail,
                    240,
                  )}
                  {cell(receiptDate(row.placedAt), 210)}
                  {cell(receiptDate(completedAt(row)), 210)}
                  {cell(row.paymentMethod, 110)}
                  {cell(receiptMoney(row.total, row.currency), 120)}
                  {cell(row.flaggedAt ? 'Flagged' : '-', 110)}
                  <View role="cell" style={{ width: 200, padding: 8, gap: 8 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'View receipt ' + row.orderNumber}
                      style={button}
                      onPress={() => setSelected(row.id)}
                    >
                      <Text style={{ color: '#fff' }}>View / flag</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'Print receipt ' + row.orderNumber}
                      onPress={() => print(row)}
                    >
                      <Text style={{ color: colors.primary, padding: 8 }}>Print / Save PDF</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          {!query.isPending && !query.isError && orders.length === 0 && (
            <Text style={[text, { marginVertical: 12 }]}>
              {query.data?.nextToken
                ? 'No matches on this page. Continue to the next page to search older records.'
                : 'No matching completed orders on this page.'}
            </Text>
          )}
          <Text style={[text, { marginTop: 12 }]}>
            Page {tokens.length} - {orders.length} matching records. Server filters may produce
            partially filled or empty pages; use Next while available.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>
            {tokens.length > 1 && (
              <Pressable
                accessibilityRole="button"
                style={button}
                onPress={() => {
                  setTokens((values) => values.slice(0, -1))
                  setSelected(null)
                }}
              >
                <Text style={{ color: '#fff' }}>Previous</Text>
              </Pressable>
            )}
            {!!query.data?.nextToken && (
              <Pressable
                accessibilityRole="button"
                disabled={query.isFetching}
                style={button}
                onPress={() => {
                  setTokens((values) => [...values, query.data.nextToken])
                  setSelected(null)
                }}
              >
                <Text style={{ color: '#fff' }}>Next page</Text>
              </Pressable>
            )}
          </View>
          {order && (
            <View
              style={{
                padding: 16,
                gap: 10,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
              }}
            >
              <Text style={[text, { fontWeight: 'bold', fontSize: 20 }]}>
                Receipt {order.orderNumber}
              </Text>
              <Text selectable style={text}>
                Order ID: {order.id}
              </Text>
              <Text style={text}>
                {order.customerFirstName} {order.customerLastName}
                {'\n'}
                {order.customerEmail}
                {'\n'}
                {order.customerPhone}
                {order.customerAddress ? '\n' + order.customerAddress : ''}
              </Text>
              <Text style={text}>
                Ordered: {receiptDate(order.placedAt)}
                {'\n'}Completed: {receiptDate(completedAt(order))}
              </Text>
              {(order.lines ?? []).map((line, index) => (
                <View
                  key={index}
                  style={{ paddingVertical: 8, borderTopWidth: 1, borderColor: colors.border }}
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
              <Text style={text}>
                Payment: {order.paymentMethod} |{' '}
                {order.paymentVerified ? 'Verified' : 'Not verified'}
              </Text>
              {!!order.paymentReference && (
                <Text selectable style={text}>
                  Payment reference: {order.paymentReference}
                </Text>
              )}
              {!!order.note && <Text style={text}>Customer note: {order.note}</Text>}
              {!!order.decisionNote && <Text style={text}>Admin note: {order.decisionNote}</Text>}
              <AdminOrderAction key={order.id} order={order} flag />
              <Pressable accessibilityRole="button" style={button} onPress={() => print(order)}>
                <Text style={{ color: '#fff' }}>Print receipt / Save PDF</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </AccountScreen>
  )
}
export default Receipts
