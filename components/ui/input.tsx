import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-12 w-full rounded-[--radius] border border-[--color-border] bg-[--color-card] px-4 py-3 text-base text-[--color-foreground] shadow-sm transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-[--color-muted-foreground]/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-background]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-[--color-destructive] aria-[invalid=true]:focus-visible:ring-[--color-destructive]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
