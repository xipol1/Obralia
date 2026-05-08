'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Users, Settings, Plus, Receipt } from 'lucide-react'

const tabs = [
  { href: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/facturas', label: 'Facturas', icon: Receipt },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
] as const

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 h-14 border-b border-[--color-border] bg-[--color-card]/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-2xl items-center px-4">
          <Link
            href="/presupuestos"
            className="text-2xl font-black tracking-tight text-[--color-primary]"
          >
            Obral<span className="text-[--color-accent]">i</span>a
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pt-14 pb-24 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 h-[72px] border-t border-[--color-border] bg-[--color-card]/95 backdrop-blur-md pb-safe">
        <div className="mx-auto grid h-full max-w-lg grid-cols-4 items-center px-2">
          {/* Presupuestos */}
          <NavTab
            href={tabs[0].href}
            label={tabs[0].label}
            icon={tabs[0].icon}
            active={pathname.startsWith(tabs[0].href)}
          />

          {/* Clientes */}
          <NavTab
            href={tabs[1].href}
            label={tabs[1].label}
            icon={tabs[1].icon}
            active={pathname.startsWith(tabs[1].href)}
          />

          {/* Central FAB */}
          <div className="flex items-center justify-center">
            <Link
              href="/presupuestos/nuevo"
              className="flex h-16 w-16 -translate-y-3 items-center justify-center rounded-full bg-[--color-accent] text-[--color-accent-foreground] shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Nuevo presupuesto"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Ajustes */}
          <NavTab
            href={tabs[2].href}
            label={tabs[2].label}
            icon={tabs[2].icon}
            active={pathname.startsWith(tabs[2].href)}
          />
        </div>
      </nav>
    </div>
  )
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; fill?: string; strokeWidth?: number }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors ${
        active
          ? 'text-[--color-primary]'
          : 'text-[--color-muted-foreground] hover:text-[--color-foreground]'
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[--color-accent]"
        />
      )}
      <Icon
        className="h-6 w-6"
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={active ? 1.75 : 2}
      />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  )
}
