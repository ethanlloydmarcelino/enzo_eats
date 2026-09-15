import { Banknote, Globe, Minus, Plus, ShoppingBag, Smartphone, X } from 'lucide-react-native'
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../fonts'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

// Each e-wallet's own brand color, used regardless of app theme so an option
// reads as that wallet rather than as another primary-colored app control.
const GCASH_BLUE = '#0072CE'
const PAYPAL_BLUE = '#0070BA'
// Placeholder merchant details — swap for Enzo Eats' real accounts before launch.
const GCASH_NUMBER = '0917 123 4567'
const GCASH_NAME = 'Enzo Eats'
const PAYPAL_EMAIL = 'pay@enzoeats.ph'
const PAYPAL_ME_LINK = 'https://paypal.me/EnzoEats'

export const CartDrawer = () => {
  const { cart, cartOpen, setCartOpen, changeQuantity, clearCart, paymentMethod, setPaymentMethod } =
    useOrderStore()
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const paymentMethods = [
    { id: 'cash', label: t('payCash'), Icon: Banknote, accent: colors.primary },
    { id: 'gcash', label: t('payGcash'), Icon: Smartphone, accent: GCASH_BLUE },
    { id: 'paypal', label: t('payPaypal'), Icon: Globe, accent: PAYPAL_BLUE },
  ]
  const checkoutAccent =
    paymentMethods.find((method) => method.id === paymentMethod)?.accent ?? colors.primary
  const checkoutLabel =
    paymentMethod === 'gcash'
      ? t('continueGcash')
      : paymentMethod === 'paypal'
        ? t('continuePaypal')
        : t('pickupCheckout')

  return (
    <Modal
      visible={cartOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setCartOpen(false)}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable
          style={styles.dismissArea}
          onPress={() => setCartOpen(false)}
          accessibilityLabel={t('closeCart')}
        />
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
            <Pressable
              onPress={() => setCartOpen(false)}
              style={[styles.close, { backgroundColor: colors.muted }]}
            >
              <X size={20} color={colors.foreground} />
            </Pressable>
          </View>
          {!cart.length ? (
            <View style={styles.empty}>
              <ShoppingBag size={46} strokeWidth={1.4} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('emptyBag')}</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('emptyBagText')}
              </Text>
              <Pressable
                onPress={() => setCartOpen(false)}
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
                    {paymentMethods.map(({ id, label, Icon, accent }) => {
                      const active = paymentMethod === id
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setPaymentMethod(id)}
                          style={[
                            styles.paymentOption,
                            {
                              borderColor: active ? accent : colors.border,
                              backgroundColor: active ? `${accent}14` : colors.card,
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
                    </View>
                  )}
                  {paymentMethod === 'paypal' && (
                    <View
                      style={[
                        styles.walletCard,
                        { borderColor: PAYPAL_BLUE, backgroundColor: `${PAYPAL_BLUE}0d` },
                      ]}
                    >
                      <Text style={[styles.walletText, { color: colors.foreground }]}>
                        {t('paypalInstructions', { amount: subtotal.toFixed(2) })}
                      </Text>
                      <View style={styles.walletRow}>
                        <Text style={[styles.walletRowLabel, { color: colors.mutedForeground }]}>
                          {t('paypalAccount')}
                        </Text>
                        <Text
                          selectable
                          style={[styles.walletRowValue, { color: colors.foreground }]}
                        >
                          {PAYPAL_EMAIL}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => Linking.openURL(PAYPAL_ME_LINK)}
                        style={[styles.walletButton, { borderColor: PAYPAL_BLUE }]}
                      >
                        <Text style={[styles.walletButtonText, { color: PAYPAL_BLUE }]}>
                          {t('openPaypal')}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                <Pressable style={[styles.checkout, { backgroundColor: checkoutAccent }]}>
                  <Text style={styles.checkoutText}>{checkoutLabel}</Text>
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
  emptyTitle: { fontSize: 24, fontFamily: fonts.black, marginTop: 18 },
  emptyText: { fontSize: 14, marginTop: 8 },
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
  checkout: { minHeight: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: '#fff', fontFamily: fonts.extraBold },
  clear: { textAlign: 'center', fontSize: 12, fontFamily: fonts.bold, marginTop: 15 },
})
