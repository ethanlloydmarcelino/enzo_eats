import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { MenuSection } from './components/MenuSection'
import { Story } from './components/Story'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'
import { MobileNav } from './components/MobileNav'
import { useThemeStore } from './store/useThemeStore'
import { useLanguageStore } from './store/useLanguageStore'
import { useColors } from './theme'

const queryClient = new QueryClient()

const App = () => {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [menuY, setMenuY] = useState(0)
  const scrollRef = useRef(null)
  const searchRef = useRef(null)
  const theme = useThemeStore((state) => state.theme)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)
  const hydrateLanguage = useLanguageStore((state) => state.hydrateLanguage)
  const colors = useColors(theme)

  useEffect(() => {
    hydrateTheme()
    hydrateLanguage()
  }, [hydrateLanguage, hydrateTheme])

  const openMenu = () => scrollRef.current?.scrollTo({ y: menuY, animated: true })
  const focusSearch = () => {
    openMenu()
    setTimeout(() => searchRef.current?.focus(), 450)
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Header onMenu={openMenu} onSearch={focusSearch} />
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Hero onOrder={openMenu} />
            <View onLayout={(event) => setMenuY(event.nativeEvent.layout.y)}>
              <MenuSection
                category={category}
                setCategory={setCategory}
                search={search}
                setSearch={setSearch}
                searchRef={searchRef}
              />
            </View>
            <Story />
            <Footer />
          </ScrollView>
          <MobileNav
            onHome={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            onMenu={openMenu}
            onSearch={focusSearch}
          />
          <CartDrawer />
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 74 },
})

export default App
