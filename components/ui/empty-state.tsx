import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[--color-muted] p-4 text-[--color-muted-foreground] [&>svg]:h-10 [&>svg]:w-10">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-lg font-bold text-[--color-foreground]">
        {title}
      </h3>
      {description && (
        <p className="mx-auto max-w-sm text-sm text-[--color-muted-foreground]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
