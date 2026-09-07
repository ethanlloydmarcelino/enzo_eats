import { Home, Search, ShoppingBag, Utensils } from 'lucide-react'
import { useOrderStore } from '../store/useOrderStore'

export const MobileNav = ({ onSearch }) => {
  const setCartOpen = useOrderStore((state) => state.setCartOpen)
  const cart = useOrderStore((state) => state.cart)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t bg-card/95 px-2 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <a href="#top" className="mobile-nav-item text-primary">
        <Home size={19} />
        <span>Home</span>
      </a>
      <a href="#menu" className="mobile-nav-item">
        <Utensils size={19} />
        <span>Menu</span>
      </a>
      <button onClick={onSearch} className="mobile-nav-item">
        <Search size={19} />
        <span>Search</span>
      </button>
      <button onClick={() => setCartOpen(true)} className="mobile-nav-item relative">
        <ShoppingBag size={19} />
        <span>Bag {count ? `(${count})` : ''}</span>
      </button>
    </nav>
  )
}
