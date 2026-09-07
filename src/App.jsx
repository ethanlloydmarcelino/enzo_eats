import { useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { MenuSection } from './components/MenuSection'
import { Story } from './components/Story'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'
import { MobileNav } from './components/MobileNav'

const App = () => {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const focusSearch = () => {
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => document.querySelector('#menu-search')?.focus(), 450)
  }
  return (
    <>
      <Header onSearch={focusSearch} />
      <main>
        <Hero />
        <MenuSection
          category={category}
          setCategory={setCategory}
          search={search}
          setSearch={setSearch}
        />
        <Story />
      </main>
      <Footer />
      <CartDrawer />
      <MobileNav onSearch={focusSearch} />
    </>
  )
}

export default App
