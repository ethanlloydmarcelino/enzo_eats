import { Minus, Plus, ShoppingBag, X } from 'lucide-react-native'
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOrderStore } from '../store/useOrderStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const CartDrawer = () => {
  const { cart, cartOpen, setCartOpen, changeQuantity, clearCart } = useOrderStore()
  const colors = useColors(useThemeStore((state) => state.theme))
  const { language, t } = useTranslations()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const service = subtotal ? 2.5 : 0

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
                  <View key={item.id} style={[styles.item, { borderBottomColor: colors.border }]}>
                    <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
                    <View style={styles.itemCopy}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemName, { color: colors.foreground }]}>
                          {item.name[language]}
                        </Text>
                        <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                          ${item.price * item.quantity}
                        </Text>
                      </View>
                      <Text style={[styles.itemCategory, { color: colors.mutedForeground }]}>
                        {t(item.category)}
                      </Text>
                      <View style={[styles.quantity, { borderColor: colors.border }]}>
                        <Pressable
                          accessibilityLabel={t('removeOne', { name: item.name[language] })}
                          onPress={() => changeQuantity(item.id, -1)}
                          style={styles.quantityButton}
                        >
                          <Minus size={14} color={colors.foreground} />
                        </Pressable>
                        <Text style={[styles.quantityText, { color: colors.foreground }]}>
                          {item.quantity}
                        </Text>
                        <Pressable
                          accessibilityLabel={t('addOne', { name: item.name[language] })}
                          onPress={() => changeQuantity(item.id, 1)}
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
                  <Text style={{ color: colors.mutedForeground }}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={{ color: colors.mutedForeground }}>{t('serviceFee')}</Text>
                  <Text style={{ color: colors.mutedForeground }}>${service.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.total, { color: colors.foreground }]}>{t('total')}</Text>
                  <Text style={[styles.total, { color: colors.foreground }]}>
                    ${(subtotal + service).toFixed(2)}
                  </Text>
                </View>
                <Pressable style={[styles.checkout, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkoutText}>{t('pickupCheckout')}</Text>
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
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.7 },
  description: { fontSize: 13, marginTop: 4 },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { minHeight: 420, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { fontSize: 24, fontWeight: '900', marginTop: 18 },
  emptyText: { fontSize: 14, marginTop: 8 },
  primary: { marginTop: 24, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 13 },
  primaryText: { color: '#fff', fontWeight: '800' },
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
  itemName: { flex: 1, fontSize: 15, fontWeight: '800' },
  itemPrice: { fontSize: 14, fontWeight: '800' },
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
  quantityText: { minWidth: 24, textAlign: 'center', fontSize: 12, fontWeight: '800' },
  summary: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  totalRow: { marginTop: 8, marginBottom: 18 },
  total: { fontSize: 20, fontWeight: '900' },
  checkout: { minHeight: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: '#fff', fontWeight: '800' },
  clear: { textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 15 },
})
