'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, Library, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AjustesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items = [
    {
      href: '/ajustes/empresa',
      icon: Building2,
      title: 'Datos de empresa',
      description: 'Edita razón social, NIF, dirección',
    },
    {
      href: '/ajustes/biblioteca',
      icon: Library,
      title: 'Mi biblioteca de partidas',
      description: 'Gestiona partidas personalizadas',
    },
    {
      href: '/ajustes/facturacion',
      icon: CreditCard,
      title: 'Facturación y plan',
      description: 'Gestiona tu suscripción',
    },
  ]

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-[--color-foreground]">Ajustes</h1>

      <div className="mt-6 space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-4 shadow-sm transition-all hover:border-[--color-primary]/30 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--color-accent]/15">
                <Icon className="h-5 w-5 text-[--color-accent]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[--color-foreground]">
                  {item.title}
                </p>
                <p className="text-sm text-[--color-muted-foreground]">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[--color-muted-foreground] transition-transform group-hover:translate-x-0.5" />
            </Link>
          )
        })}
      </div>

      <div className="mt-10 border-t border-[--color-border] pt-6">
        <Button
          variant="outline"
          size="lg"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut className="h-5 w-5" />
          {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      </div>
    </div>
  )
}
