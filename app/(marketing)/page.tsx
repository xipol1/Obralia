import Link from 'next/link'
import { Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function MarketingPage() {
  return (
    <div className="flex min-h-dvh flex-col justify-between max-w-md mx-auto px-6 py-10">
      <div className="flex flex-1 flex-col justify-center space-y-10">
        {/* Wordmark */}
        <div className="text-5xl font-black tracking-tight text-[--color-primary]">
          Obral<span className="text-[--color-accent]">i</span>a
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight text-[--color-foreground]">
            Presupuestos de obra al momento.
          </h1>
          <p className="text-lg text-[--color-muted-foreground]">
            Crea, manda por WhatsApp y cobra. Sin abrir el ordenador.
          </p>
        </div>

        {/* Value props */}
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <Check className="h-6 w-6 shrink-0 text-[--color-accent]" strokeWidth={2.5} />
            <span className="text-base text-[--color-foreground]">
              Asistente de IVA español integrado
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-6 w-6 shrink-0 text-[--color-accent]" strokeWidth={2.5} />
            <span className="text-base text-[--color-foreground]">
              PDF con tu marca en un toque
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-6 w-6 shrink-0 text-[--color-accent]" strokeWidth={2.5} />
            <span className="text-base text-[--color-foreground]">
              Envío directo por WhatsApp
            </span>
          </li>
        </ul>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/login"
            className={buttonVariants({ variant: 'accent', size: 'xl' }) + ' w-full'}
          >
            Empezar →
          </Link>
          <p className="text-center text-sm text-[--color-muted-foreground]">
            Prueba gratis 14 días • Sin tarjeta
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="pt-8 text-center text-xs text-[--color-muted-foreground]">
        Hecho en España
      </p>
    </div>
  )
}
