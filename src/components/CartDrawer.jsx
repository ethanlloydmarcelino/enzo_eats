import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useOrderStore } from '../store/useOrderStore'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet'

export const CartDrawer = () => {
  const { cart, cartOpen, orderType, setCartOpen, changeQuantity, clearCart } = useOrderStore()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const service = subtotal ? 2.5 : 0
  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your order</SheetTitle>
          <SheetDescription>{orderType} · ready in 20–30 min</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!cart.length ? (
            <div className="grid h-full place-content-center text-center">
              <ShoppingBag size={44} strokeWidth={1.4} className="mx-auto text-ink/30" />
              <p className="mt-4 text-2xl font-bold tracking-tight">Your bag is empty</p>
              <p className="mt-2 text-sm text-muted-foreground">Add a dish to get started.</p>
              <Button className="mt-6" onClick={() => setCartOpen(false)}>
                Browse menu
              </Button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 border-b py-5 first:pt-0">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: item.position }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="font-semibold">${item.price * item.quantity}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                  <div className="mt-3 flex w-fit items-center rounded-lg border">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      className="p-1.5"
                      aria-label={`Remove one ${item.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      className="p-1.5"
                      aria-label={`Add one ${item.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t bg-card p-5 sm:p-6">
            <div className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="mb-5 flex justify-between text-sm text-muted-foreground">
              <span>Service fee</span>
              <span>${service.toFixed(2)}</span>
            </div>
            <div className="mb-5 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>${(subtotal + service).toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full">
              Continue to checkout · {orderType}
            </Button>
            <button
              onClick={clearCart}
              className="mt-4 w-full text-xs font-semibold text-muted-foreground hover:text-primary"
            >
              Clear bag
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
