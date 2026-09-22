import '../src/amplify'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthModal } from '../src/components/AuthModal'
import { CartDrawer } from '../src/components/CartDrawer'
import { LaunchScreen } from '../src/components/LaunchScreen'
import { listenToAuth } from '../src/store/useAuthStore'
import { useLanguageStore } from '../src/store/useLanguageStore'
import { useThemeStore } from '../src/store/useThemeStore'
import { useColors } from '../src/theme'
import { useAppFonts } from '../src/fonts'
import { AccountSync } from '../src/components/account/AccountSync'
import { OrderNotifications } from '../src/components/account/OrderNotifications'

import { NotificationPrompt } from '../src/components/account/NotificationPrompt'

const queryClient = new QueryClient()

const RootLayout = () => {
  const [appReady, setAppReady] = useState(false)
  const [showLaunch, setShowLaunch] = useState(true)
  const theme = useThemeStore((state) => state.theme)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)
  const hydrateLanguage = useLanguageStore((state) => state.hydrateLanguage)
  const colors = useColors(theme)
  const [fontsLoaded] = useAppFonts()

  useEffect(() => {
    if (!fontsLoaded) return undefined
    let active = true
    const minimumDisplay = new Promise((resolve) => setTimeout(resolve, 1200))

    Promise.all([hydrateTheme(), hydrateLanguage(), minimumDisplay]).finally(() => {
      if (active) setAppReady(true)
    })

    return () => {
      active = false
    }
  }, [fontsLoaded, hydrateLanguage, hydrateTheme])

  useEffect(() => listenToAuth(), [])

  const finishLaunch = useCallback(() => setShowLaunch(false), [])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
        {/* Both live above the stack so the bag and the sign-in sheet follow the
            customer from the menu into the account screens. */}
        <CartDrawer />
        <AuthModal />
        <AccountSync />
        <OrderNotifications />
        {!showLaunch && <NotificationPrompt />}
        {showLaunch && <LaunchScreen ready={appReady} onFinished={finishLaunch} />}
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

export default RootLayout
