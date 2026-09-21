import { router } from 'expo-router'
import {
  ChevronRight,
  ClipboardList,
  Heart,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Tag,
  UserCog,
} from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { Avatar } from '../../src/components/account/Avatar'
import { fonts } from '../../src/fonts'
import { roleLabelKeys } from '../../src/auth/roles'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useOrderStore } from '../../src/store/useOrderStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'
import { useMyOrders, useReviewCount, isPastOrder } from '../../src/orders/useOrders'

const ADMIN_ROLES = ['admin', 'super_admin']

const Row = ({ Icon, label, hint, badge, onPress, colors, destructive }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={[styles.row, { borderBottomColor: colors.border }]}
  >
    <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
      <Icon size={19} color={destructive ? '#c43c3c' : colors.foreground} />
    </View>
    <View style={styles.rowCopy}>
      <Text
        style={[styles.rowLabel, { color: destructive ? '#c43c3c' : colors.foreground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {!!hint && (
        <Text numberOfLines={1} style={[styles.rowHint, { color: colors.mutedForeground }]}>
          {hint}
        </Text>
      )}
    </View>
    {badge > 0 && (
      <View style={[styles.badge, { backgroundColor: colors.coral }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    {!destructive && <ChevronRight size={18} color={colors.mutedForeground} />}
  </Pressable>
)

const AccountHome = () => {
  const { attributes, role, logOut } = useAuthStore()
  const favorites = useOrderStore((state) => state.favorites)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const { data: orders } = useMyOrders()
  const reviewCount = useReviewCount()
  const isAdmin = ADMIN_ROLES.includes(role)

  const active = (orders ?? []).filter((order) => !isPastOrder(order)).length
  const past = (orders ?? []).filter(isPastOrder).length
  const fullName = `${attributes?.given_name ?? ''} ${attributes?.family_name ?? ''}`.trim()

  const signOut = async () => {
    await logOut()
    router.replace('/')
  }

  return (
    <AccountScreen title={t('account')}>
      <View style={[styles.identity, { backgroundColor: colors.muted }]}>
        <Avatar attributes={attributes} size={68} />
        <View style={styles.identityCopy}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[styles.name, { color: colors.foreground }]}
          >
            {fullName || t('authProfile')}
          </Text>
          <Text numberOfLines={1} style={[styles.email, { color: colors.mutedForeground }]}>
            {attributes?.email}
          </Text>
          <View style={[styles.rolePill, { backgroundColor: colors.background }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {t(roleLabelKeys[role] ?? 'authRoleUser')}
            </Text>
          </View>
        </View>
      </View>

      {isAdmin && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            {t('adminSection')}
          </Text>
          <View
            style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Row
              Icon={ShieldCheck}
              colors={colors}
              label={t('adminApprovals')}
              hint={t('adminApprovalsHint')}
              badge={reviewCount}
              onPress={() => router.push('/account/admin')}
            />
          </View>
        </>
      )}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        {t('accountOrdersSection')}
      </Text>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row
          Icon={ClipboardList}
          colors={colors}
          label={t('accountOrders')}
          hint={t('accountOrdersHint', { active, past })}
          onPress={() => router.push('/account/orders')}
        />
        <Row
          Icon={Heart}
          colors={colors}
          label={t('accountFavorites')}
          hint={t('accountFavoritesHint', { count: favorites.length })}
          onPress={() => router.push('/account/favorites')}
        />
        <Row
          Icon={Tag}
          colors={colors}
          label={t('accountPromotions')}
          hint={t('accountPromotionsHint')}
          onPress={() => router.push('/account/promotions')}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        {t('accountSettingsSection')}
      </Text>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row
          Icon={UserCog}
          colors={colors}
          label={t('accountManageProfile')}
          hint={t('accountManageProfileHint')}
          onPress={() => router.push('/account/profile')}
        />
        <Row
          Icon={HelpCircle}
          colors={colors}
          label={t('accountHelp')}
          hint={t('accountHelpHint')}
          onPress={() => router.push('/account/help')}
        />
        <Row
          Icon={LogOut}
          colors={colors}
          destructive
          label={t('authSignOut')}
          onPress={() => void signOut()}
        />
      </View>
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', gap: 16, padding: 18, borderRadius: 18, alignItems: 'center' },
  identityCopy: { flex: 1, gap: 3 },
  name: { fontSize: 22, fontFamily: fonts.black, letterSpacing: -0.6 },
  email: { fontSize: 13 },
  rolePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontFamily: fonts.extraBold, letterSpacing: 0.3 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 26,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontFamily: fonts.extraBold },
  rowHint: { fontSize: 12 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.extraBold },
})

export default AccountHome
