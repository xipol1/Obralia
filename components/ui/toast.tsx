'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'destructive'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toast: (props: Omit<Toast, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const MAX_TOASTS = 3
const TOAST_DURATION = 4000

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9)
      setToasts((prev) => {
        const next = [...prev, { ...props, id }]
        return next.slice(-MAX_TOASTS)
      })
      setTimeout(() => removeToast(id), TOAST_DURATION)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToasterProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            'w-full max-w-sm rounded-lg border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-bottom-4',
            t.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
              : 'border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {t.title && (
                <p className="text-sm font-semibold">{t.title}</p>
              )}
              {t.description && (
                <p className="mt-1 text-sm opacity-80">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export { ToastProvider, useToast, Toaster }
export type { Toast, ToastVariant }
