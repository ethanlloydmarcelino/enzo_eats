import { Search, ShoppingBag, UserRound } from 'lucide-react'
import { Logo } from './Logo'
import { useOrderStore } from '../store/useOrderStore'
import { Button } from './ui/button'
import { ThemeToggle } from './ThemeToggle'

export const Header = ({ onSearch }) => {
  const cart = useOrderStore((state) => state.cart)
  const setCartOpen = useOrderStore((state) => state.setCartOpen)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav
          className="hidden items-center gap-2 text-sm font-semibold md:flex"
          aria-label="Primary navigation"
        >
          <a className="nav-link" href="#menu">
            Menu
          </a>
          <a className="nav-link" href="#story">
            How it works
          </a>
          <a className="nav-link" href="#footer">
            Support
          </a>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={onSearch}
            aria-label="Search menu"
          >
            <Search size={19} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Account"
          >
            <UserRound size={19} />
          </Button>
          <ThemeToggle />
          <Button
            className="relative bg-ink text-cream hover:bg-ink/85"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">My bag</span>
            {count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] text-white">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
