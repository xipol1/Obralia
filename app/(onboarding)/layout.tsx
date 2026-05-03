'use client'

import { usePathname } from 'next/navigation'

const steps: Record<string, number> = {
  '/onboarding': 1,
  '/onboarding/logo': 2,
  '/onboarding/plan': 3,
}

const TOTAL_STEPS = 3

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const currentStep = steps[pathname] ?? 1

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[--color-background] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress dots */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const stepNumber = i + 1
              const isActive = stepNumber === currentStep
              const isCompleted = stepNumber < currentStep
              return (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all ${
                    isActive
                      ? 'w-8 bg-[--color-primary]'
                      : isCompleted
                        ? 'w-2.5 bg-[--color-primary]/60'
                        : 'w-2.5 bg-[--color-muted]'
                  }`}
                />
              )
            })}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[--color-muted-foreground]">
            Paso {currentStep} de {TOTAL_STEPS}
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
