import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // Modo demo: la auth la maneja el cliente con localStorage + cookie obralia-demo.
  // Aquí sólo redirigimos según la cookie, sin tocar Supabase.
  if (isDemoMode()) {
    const isLoggedIn = request.cookies.get('obralia-demo')?.value === '1'
    const publicPaths = ['/', '/login', '/verificar']
    const isPublicPath = publicPaths.some(
      (p) => path === p || path.startsWith('/api/stripe/webhook') || path.startsWith('/api/setup'),
    )

    if (!isLoggedIn && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isLoggedIn && (path === '/login' || path === '/verificar')) {
      const url = request.nextUrl.clone()
      url.pathname = '/presupuestos'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicPaths = ['/', '/login', '/verificar']
  const isPublicPath = publicPaths.some(
    (p) => path === p || path.startsWith('/api/stripe/webhook') || path.startsWith('/api/setup'),
  )

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (path === '/login' || path === '/verificar')) {
    const url = request.nextUrl.clone()
    url.pathname = '/presupuestos'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
