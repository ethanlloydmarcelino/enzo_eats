import { useCallback, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react-native'
import { router, useFocusEffect } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../fonts'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { useColors } from '../../theme'
import { useTranslations } from '../../translations'

/**
 * Chrome shared by every account page: a back bar, the title, and the guard that
 * bounces a signed-out visitor home with the sign-in sheet already open.
 */
export const AccountScreen = ({ title, subtitle, children, scroll = true }) => {
  const status = useAuthStore((state) => state.status)
  const openAccount = useAuthStore((state) => state.openAccount)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/')
      openAccount()
    }
  }, [status, openAccount])

  // Re-check the session on every visit so a token that expired while the app
  // sat in the background is noticed here rather than at checkout.
  useFocusEffect(
    useCallback(() => {
      if (status === 'error') void useAuthStore.getState().refreshSession()
    }, [status]),
  )

  const back = () => (router.canGoBack() ? router.back() : router.replace('/account'))

  const body =
    status === 'signedIn' ? (
      children
    ) : (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel={t('authLoading')} color={colors.primary} />
      </View>
    )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.bar, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={back}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.barCopy}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.barTitle, { color: colors.foreground }]}
          >
            {title}
          </Text>
          {!!subtitle && (
            <Text numberOfLines={1} style={[styles.barSubtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{body}</View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  fill: { flex: 1 },
  bar: {
    minHeight: 60,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  barCopy: { flex: 1 },
  barTitle: { fontSize: 19, fontFamily: fonts.black, letterSpacing: -0.5 },
  barSubtitle: { fontSize: 12, marginTop: 2 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, paddingBottom: 48 },
  loading: { padding: 48, alignItems: 'center' },
})
