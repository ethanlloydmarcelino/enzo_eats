import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { profileError } from '../auth/validation'
import {
  Banknote,
  CheckCircle2,
  Globe,
  Info,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  X,
} from 'lucide-react-native'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../fonts'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'
import {
  GCASH_NAME,
  GCASH_NUMBER,
  PAYPAL_MINIMUM,
  isValidGcashReference,
  normalizeGcashReference,
  paypalAvailable,
} from '../checkout/rules'
import { orderErrorKey } from '../orders/client'
import { usePlaceOrder } from '../orders/useOrders'

// Each e-wallet's own brand color, used regardless of app theme so an option
// reads as that wallet rather than as another primary-colored app control.
const GCASH_BLUE = '#0072CE'
const PAYPAL_BLUE = '#0070BA'

export const CartDrawer = () => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    changeQuantity,
    clearCart,
    paymentMethod,
    setPaymentMethod,
  } = useOrderStore()
  const { status, attributes, accountOpen, openAccount } = useAuthStore()
  // 'cart' -> optionally 'reference' (GCash / PayPal proof) -> 'placed'.
  const [step, setStep] = useState('cart')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)
  const placeOrder = usePlaceOrder()
  const request = useRef({ key: '', id: '' })
  const profileComplete =
    attributes &&
    !profileError({
      given_name: attributes.given_name ?? '',
      family_name: attributes.family_name ?? '',
      phone_number: attributes.phone_number ?? '',
      address: attributes.address ?? '',
    })
  const requireAccount = () => {
    if (status !== 'signedIn' || !profileComplete) {
      openAccount(true)
      return false
    }
    return true
  }
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const paypalAllowed = paypalAvailable(subtotal)

  // A basket can drop below the PayPal threshold after it was selected; fall
  // back rather than leaving an unusable method armed.
  useEffect(() => {
    if (paymentMethod === 'paypal' && !paypalAllowed) setPaymentMethod('cash')
  }, [paymentMethod, paypalAllowed, setPaymentMethod])

  const close = () => {
    if (placeOrder.isPending) return
    setCartOpen(false)
    if (step === 'placed') {
      setStep('cart')
      setPlacedOrder(null)
    }
  }

  const submit = (paymentReference = '') => {
    setError('')
    const key = JSON.stringify({
      cart: cart.map(({ cartId, quantity }) => ({ cartId, quantity })),
      paymentMethod,
      paymentReference,
      user: useAuthStore.getState().user?.userId,
    })
    if (request.current.key !== key)
      request.current = {
        key,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
      }
    placeOrder.mutate(
      {
        cart,
        language,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentReference,
        requestId: request.current.id,
      },
      {
        onSuccess: (order) => {
          setPlacedOrder(order)
          setStep('placed')
          setReference('')
          clearCart()
          request.current = { key: '', id: '' }
        },
        onError: (cause) => setError(orderErrorKey(cause)),
      },
    )
  }

  const startCheckout = () => {
    if (!requireAccount()) return
    setError('')
    if (paymentMethod === 'paypal') {
      setError('paypalNotAvailable')
      return
    }
    if (paymentMethod === 'gcash') setStep('reference')
    else submit()
  }

  const confirmReference = () => {
    const value = normalizeGcashReference(reference)
    if (paymentMethod === 'gcash' && !isValidGcashReference(value)) {
      setError('orderErrorGcashReference')
      return
    }
    if (paymentMethod === 'paypal' && !value.trim()) {
      setError('orderErrorPaypalReference')
      return
    }
    submit(value)
  }

  const paymentMethods = [
    { id: 'cash', label: t('payCash'), Icon: Banknote, accent: colors.primary, enabled: true },
    { id: 'gcash', label: t('payGcash'), Icon: Smartphone, accent: GCASH_BLUE, enabled: true },
    {
      id: 'paypal',
      label: t('payPaypal'),
      Icon: Globe,
      accent: PAYPAL_BLUE,
      enabled: false,
    },
  ]
  const checkoutAccent =
    paymentMethods.find((method) => method.id === paymentMethod)?.accent ?? colors.primary
  const checkoutLabel =
    paymentMethod === 'gcash'
      ? t('continueGcash')
      : paymentMethod === 'paypal'
        ? t('continuePaypal')
        : t('pickupCheckout')

  const isGcash = paymentMethod === 'gcash'
  const referenceAccent = isGcash ? GCASH_BLUE : PAYPAL_BLUE

  const renderReferenceStep = () => (
    <View style={styles.referenceStep}>
      <Text accessibilityRole="header" style={[styles.stepTitle, { color: colors.foreground }]}>
        {t(isGcash ? 'gcashRefTitle' : 'paypalRefTitle')}
      </Text>
      <Text style={[styles.walletText, { color: colors.mutedForeground }]}>
        {t(isGcash ? 'gcashRefBody' : 'paypalRefBody', { amount: subtotal.toFixed(2) })}
      </Text>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t(isGcash ? 'gcashRefLabel' : 'paypalRefLabel')}
        </Text>
        <TextInput
          accessibilityLabel={t(isGcash ? 'gcashRefLabel' : 'paypalRefLabel')}
          value={reference}
          onChangeText={setReference}
          editable={!placeOrder.isPending}
          autoFocus
          keyboardType={isGcash ? 'number-pad' : 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={64}
          placeholder={isGcash ? '0000 0000 0000' : t('paypalRefPlaceholder')}
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
      </View>
      {!!error && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
          {t(error)}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={placeOrder.isPending}
        onPress={confirmReference}
        style={[
          styles.checkout,
          { backgroundColor: referenceAccent, opacity: placeOrder.isPending ? 0.6 : 1 },
        ]}
      >
        {placeOrder.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.checkoutText}>{t('submitReference')}</Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => {
          setStep('cart')
          setError('')
        }}
        disabled={placeOrder.isPending}
      >
        <Text style={[styles.clear, { color: colors.mutedForeground }]}>{t('backToBag')}</Text>
      </Pressable>
    </View>
  )

  const renderPlaced = () => (
    <View style={styles.empty}>
      <CheckCircle2 size={52} strokeWidth={1.5} color={colors.primary} />
      <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('orderPlacedTitle')}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: 'center' }]}>
        {t('orderPlacedBody', { number: placedOrder?.orderNumber ?? '' })}
      </Text>
      <Pressable onPress={close} style={[styles.primary, { backgroundColor: colors.primary }]}>
        <Text style={styles.primaryText}>{t('done')}</Text>
      </Pressable>
    </View>
  )

  return (
    <Modal
      visible={cartOpen && !accountOpen}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable style={styles.dismissArea} onPress={close} accessibilityLabel={t('closeCart')} />
        <View
          style={[
            styles.sheet,
            width >= 600 && styles.sheetWide,
            { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 18) },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>{t('yourOrder')}</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {t('pickupReady')}
              </Text>
            </View>
            <Pressable onPress={close} style={[styles.close, { backgroundColor: colors.muted }]}>
              <X size={20} color={colors.foreground} />
            </Pressable>
          </View>
          {step === 'placed' ? (
            renderPlaced()
          ) : step === 'reference' ? (
            <ScrollView keyboardShouldPersistTaps="handled">{renderReferenceStep()}</ScrollView>
          ) : !cart.length ? (
            <View style={styles.empty}>
              <ShoppingBag size={46} strokeWidth={1.4} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('emptyBag')}</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('emptyBagText')}
              </Text>
              <Pressable
                onPress={close}
                style={[styles.primary, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryText}>{t('browseMenu')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.items}>
                {cart.map((item) => (
                  <View
                    key={item.cartId}
                    style={[styles.item, { borderBottomColor: colors.border }]}
                  >
                    <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
                    <View style={styles.itemCopy}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemName, { color: colors.foreground }]}>
                          {item.name[language]}
                        </Text>
                        <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                          ₱{item.price * item.quantity}
                        </Text>
                      </View>
                      <Text style={[styles.itemCategory, { color: colors.mutedForeground }]}>
                        {item.selectedOption
                          ? `${t(item.category)} · ${item.selectedOption.name[language]}`
                          : t(item.category)}
                      </Text>
                      <View style={[styles.quantity, { borderColor: colors.border }]}>
                        <Pressable
                          accessibilityLabel={t('removeOne', { name: item.name[language] })}
                          onPress={() => changeQuantity(item.cartId, -1)}
                          style={styles.quantityButton}
                        >
                          <Minus size={14} color={colors.foreground} />
                        </Pressable>
                        <Text style={[styles.quantityText, { color: colors.foreground }]}>
                          {item.quantity}
                        </Text>
                        <Pressable
                          accessibilityLabel={t('addOne', { name: item.name[language] })}
                          onPress={() => changeQuantity(item.cartId, 1)}
                          style={styles.quantityButton}
                        >
                          <Plus size={14} color={colors.foreground} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={[styles.summary, { borderTopColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={{ color: colors.mutedForeground }}>{t('subtotal')}</Text>
                  <Text style={{ color: colors.mutedForeground }}>₱{subtotal.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.total, { color: colors.foreground }]}>{t('total')}</Text>
                  <Text style={[styles.total, { color: colors.foreground }]}>
                    ₱{subtotal.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.paymentSection}>
                  <Text style={[styles.paymentLabel, { color: colors.mutedForeground }]}>
                    {t('paymentMethod')}
                  </Text>
                  <View style={styles.paymentOptions}>
                    {paymentMethods.map(({ id, label, Icon, accent, enabled }) => {
                      const active = paymentMethod === id
                      return (
                        <Pressable
                          key={id}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !enabled, selected: active }}
                          accessibilityHint={
                            enabled
                              ? undefined
                              : t('paypalMinimumNotice', { amount: PAYPAL_MINIMUM })
                          }
                          disabled={!enabled}
                          onPress={() => setPaymentMethod(id)}
                          style={[
                            styles.paymentOption,
                            {
                              borderColor: active ? accent : colors.border,
                              backgroundColor: active ? `${accent}14` : colors.card,
                              opacity: enabled ? 1 : 0.45,
                            },
                          ]}
                        >
                          <Icon size={18} color={active ? accent : colors.mutedForeground} />
                          <Text
                            style={[
                              styles.paymentOptionText,
                              { color: active ? accent : colors.foreground },
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                  {!paypalAllowed && (
                    <View style={styles.noteRow}>
                      <Info size={14} color={colors.mutedForeground} />
                      <Text
                        accessibilityLiveRegion="polite"
                        style={[styles.noteText, { color: colors.mutedForeground }]}
                      >
                        {t('paypalMinimumNotice', { amount: PAYPAL_MINIMUM })}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                    {t('paypalNotAvailable')}
                  </Text>
                  {paymentMethod === 'cash' && (
                    <View style={styles.noteRow}>
                      <Info size={14} color={colors.mutedForeground} />
                      <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                        {t('cashApprovalNotice')}
                      </Text>
                    </View>
                  )}
                  {paymentMethod === 'gcash' && (
                    <View
                      style={[
                        styles.walletCard,
                        { borderColor: GCASH_BLUE, backgroundColor: `${GCASH_BLUE}0d` },
                      ]}
                    >
                      <Text style={[styles.walletText, { color: colors.foreground }]}>
                        {t('gcashInstructions', { amount: subtotal.toFixed(2) })}
                      </Text>
                      <View style={styles.walletRow}>
                        <Text style={[styles.walletRowLabel, { color: colors.mutedForeground }]}>
                          {t('gcashNumber')}
                        </Text>
                        <Text
                          selectable
                          style={[styles.walletRowValue, { color: colors.foreground }]}
                        >
                          {GCASH_NUMBER}
                        </Text>
                      </View>
                      <View style={styles.walletRow}>
                        <Text style={[styles.walletRowLabel, { color: colors.mutedForeground }]}>
                          {t('gcashAccountName')}
                        </Text>
                        <Text style={[styles.walletRowValue, { color: colors.foreground }]}>
                          {GCASH_NAME}
                        </Text>
                      </View>
                      <View style={styles.noteRow}>
                        <Info size={14} color={GCASH_BLUE} />
                        <Text style={[styles.noteText, { color: colors.foreground }]}>
                          {t('gcashReferenceExplainer')}
                        </Text>
                      </View>
                    </View>
                  )}
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
                <Pressable
                  accessibilityRole="button"
                  disabled={status === 'loading' || placeOrder.isPending}
                  onPress={startCheckout}
                  style={[
                    styles.checkout,
                    {
                      backgroundColor: checkoutAccent,
                      opacity: status === 'loading' || placeOrder.isPending ? 0.5 : 1,
                    },
                  ]}
                >
                  {placeOrder.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.checkoutText}>
                      {status === 'loading'
                        ? t('authLoading')
                        : status !== 'signedIn'
                          ? t('authCheckout')
                          : checkoutLabel}
                    </Text>
                  )}
                </Pressable>
                <Pressable onPress={clearCart}>
                  <Text style={[styles.clear, { color: colors.mutedForeground }]}>
                    {t('clearBag')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  dismissArea: { flex: 1 },
  sheet: {
    width: '100%',
    maxHeight: '92%',
    marginTop: 'auto',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetWide: { width: 440, height: '100%', maxHeight: '100%', marginLeft: 'auto', borderRadius: 0 },
  header: {
    padding: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontFamily: fonts.black, letterSpacing: -0.7 },
  description: { fontSize: 13, marginTop: 4 },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { minHeight: 420, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { fontSize: 24, fontFamily: fonts.black, marginTop: 18, textAlign: 'center' },
  emptyText: { fontSize: 14, marginTop: 8, lineHeight: 21 },
  primary: { marginTop: 24, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 13 },
  primaryText: { color: '#fff', fontFamily: fonts.extraBold },
  items: { padding: 20 },
  item: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemImage: { width: 78, height: 78, borderRadius: 12 },
  itemCopy: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 15, fontFamily: fonts.extraBold },
  itemPrice: { fontSize: 14, fontFamily: fonts.extraBold },
  itemCategory: { fontSize: 11, marginTop: 4 },
  quantity: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,
  },
  quantityButton: { padding: 7 },
  quantityText: { minWidth: 24, textAlign: 'center', fontSize: 12, fontFamily: fonts.extraBold },
  summary: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  totalRow: { marginTop: 8, marginBottom: 18 },
  total: { fontSize: 20, fontFamily: fonts.black },
  paymentSection: { marginBottom: 16 },
  paymentLabel: {
    fontSize: 11,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paymentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentOption: {
    flexGrow: 1,
    flexBasis: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  paymentOptionText: { fontSize: 13, fontFamily: fonts.extraBold, textAlign: 'center' },
  walletCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12, gap: 8 },
  walletText: { fontSize: 12, lineHeight: 18 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletRowLabel: { fontSize: 11 },
  walletRowValue: { fontSize: 13, fontFamily: fonts.extraBold },
  walletButton: {
    borderWidth: 1.5,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  walletButtonText: { fontSize: 13, fontFamily: fonts.extraBold },
  noteRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 10 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  referenceStep: { padding: 22 },
  stepTitle: { fontSize: 20, fontFamily: fonts.black, letterSpacing: -0.5, marginBottom: 8 },
  field: { gap: 6, marginTop: 16, marginBottom: 4 },
  label: { fontSize: 13, fontFamily: fonts.bold },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
  },
  checkout: {
    minHeight: 50,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  checkoutText: { color: '#fff', fontFamily: fonts.extraBold },
  clear: { textAlign: 'center', fontSize: 12, fontFamily: fonts.bold, marginTop: 15 },
  error: { color: '#c43c3c', fontSize: 13, lineHeight: 20, marginTop: 12 },
})
