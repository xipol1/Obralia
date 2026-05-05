'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { emailPasswordSchema } from '@/schemas/auth'

/**
 * Asegura que existe un usuario con ese email + contraseña.
 *
 * - Si no existe: lo crea con email_confirm=true para saltarse la verificación.
 * - Si existe pero la contraseña es distinta: la actualiza (modo MVP, simplifica
 *   la UX para usuarios que olvidan la clave).
 * - Si la contraseña ya coincide: no hace nada.
 *
 * Devuelve { ok: true } si el usuario está listo para signInWithPassword.
 */
export async function asegurarUsuario(formData: {
  email: string
  password: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = emailPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos no válidos',
    }
  }
  const { email, password } = parsed.data

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'Servidor mal configurado' }
  }

  const admin = await createServiceRoleClient()

  // Buscar usuario por email
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listErr) {
    return { ok: false, error: listErr.message }
  }
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )

  if (!existing) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  // Actualiza la contraseña del usuario existente para que el siguiente
  // signInWithPassword funcione. Reduce fricción en MVP (sin "olvidé contraseña").
  const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (updErr) return { ok: false, error: updErr.message }

  return { ok: true }
}
