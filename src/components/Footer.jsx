import { Headphones, Instagram } from 'lucide-react'
import { Logo } from './Logo'

export const Footer = () => {
  return (
    <footer id="footer" className="bg-[#111] pb-24 text-white md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="[&_span:last-child]:!text-white">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
              Simple online ordering for your favorite rice meals.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Ordering</p>
            <div className="mt-4 space-y-2 text-sm text-white/60">
              <p>Pickup or delivery</p>
              <p>Available every day</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Support</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-white/60">
              <Headphones size={17} /> Contact Enzo Eats about your order
            </p>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-white/40">
          <p>© 2026 Enzo Eats</p>
          <a href="#top" aria-label="Instagram">
            <Instagram size={17} />
          </a>
        </div>
      </div>
    </footer>
  )
}
