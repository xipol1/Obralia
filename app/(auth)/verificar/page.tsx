'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// La verificación por SMS ha sido sustituida por email + contraseña.
// Cualquiera que aterrice aquí va al login.
export default function VerificarPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/login')
  }, [router])
  return null
}
