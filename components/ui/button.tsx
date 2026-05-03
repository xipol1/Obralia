import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[--radius] text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:transition-transform',
  {
    variants: {
      variant: {
        default:
          'bg-[--color-primary] text-[--color-primary-foreground] shadow-sm hover:bg-[--color-primary]/90',
        accent:
          'bg-[--color-accent] text-[--color-accent-foreground] shadow-sm hover:bg-[--color-accent]/90',
        destructive:
          'bg-[--color-destructive] text-[--color-destructive-foreground] shadow-sm hover:bg-[--color-destructive]/90',
        outline:
          'border-2 border-[--color-border] bg-[--color-card] text-[--color-foreground] hover:bg-[--color-muted]',
        secondary:
          'bg-[--color-muted] text-[--color-foreground] hover:bg-[--color-muted]/80',
        ghost:
          'text-[--color-foreground] hover:bg-[--color-muted]',
        link:
          'text-[--color-primary] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-5 py-3',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-14 px-8 text-base',
        xl: 'h-16 px-10 text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
