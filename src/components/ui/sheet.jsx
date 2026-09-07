import { forwardRef } from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

export const SheetContent = forwardRef(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-background shadow-2xl outline-none duration-300',
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X size={20} />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

export const SheetHeader = ({ className, ...props }) => (
  <div className={cn('border-b p-6 pr-16', className)} {...props} />
)

export const SheetTitle = forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-2xl font-bold tracking-tight', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

export const SheetDescription = forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('mt-1 text-sm text-muted-foreground', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName
