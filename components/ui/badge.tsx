import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[--color-accent]/15 text-[--color-accent-foreground] border border-[--color-accent]/30',
  success:
    'bg-green-100 text-green-900 border border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-900',
  warning:
    'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900',
  destructive:
    'bg-red-100 text-red-900 border border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-900',
  info: 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900',
  muted:
    'bg-[--color-muted] text-[--color-muted-foreground] border border-[--color-border]',
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
export type { BadgeProps, BadgeVariant }
