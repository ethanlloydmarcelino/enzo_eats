import { useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Header } from '../src/components/Header'
import { Hero } from '../src/components/Hero'
import { MenuSection } from '../src/components/MenuSection'
import { Story } from '../src/components/Story'
import { Footer } from '../src/components/Footer'
import { MobileNav } from '../src/components/MobileNav'
import { useThemeStore } from '../src/store/useThemeStore'
import { useColors } from '../src/theme'

const HomeScreen = () => {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [menuY, setMenuY] = useState(0)
  const scrollRef = useRef(null)
  const searchRef = useRef(null)
  const colors = useColors(useThemeStore((state) => state.theme))

  const openMenu = () => scrollRef.current?.scrollTo({ y: menuY, animated: true })
  const focusSearch = () => {
    openMenu()
    setTimeout(() => searchRef.current?.focus(), 450)
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 74 },
})

export default HomeScreen
