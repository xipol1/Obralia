'use server'

import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'
import { empresaSchema, type EmpresaFormData } from '@/schemas/empresa'

/**
 * Crea la empresa y la membresía del usuario actual atómicamente.
 *
 * Usamos service_role para bypassear RLS porque:
 *  - El usuario aún no es miembro de la empresa que acaba de crear, así que
 *    el SELECT policy de empresas no le permitiría leer la fila recién
 *    insertada (PostgREST hace INSERT...RETURNING bajo el capó).
 *  - Es la primera operación de su cuenta: no hay riesgo de tenant cruzado.
 *
 * El user_id se toma de la sesión del navegador (cookies), nunca del input
 * del cliente.
 */
export async function crearEmpresaConMembresia(
  input: EmpresaFormData,
): Promise<
  | { ok: true; empresaId: string }
  | { ok: false; error: string }
> {
  const parsed = empresaSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos no válidos',
    }
  }
  const data = parsed.data

  const userClient = await createServerSupabaseClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Sesión expirada' }
  }

  const admin = await createServiceRoleClient()

  // Si el usuario YA tiene una empresa, no creamos otra
  const { data: existing } = await admin
    .from('miembros')
    .select('empresa_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing?.empresa_id) {
    return { ok: true, empresaId: existing.empresa_id }
  }

  const { data: empresa, error: empresaError } = await admin
    .from('empresas')
    .insert({
      razon_social: data.razon_social,
      nif: data.nif,
      direccion: data.direccion || null,
      codigo_postal: data.codigo_postal || null,
      municipio: data.municipio || null,
      provincia: data.provincia || null,
      email: data.email || null,
      telefono: data.telefono || null,
    })
    .select('id')
    .single()

  if (empresaError || !empresa) {
    return {
      ok: false,
      error: empresaError?.message ?? 'No se pudo crear la empresa',
    }
  }

  const { error: miembroError } = await admin.from('miembros').insert({
    empresa_id: empresa.id,
    user_id: user.id,
    rol: 'owner',
  })

  if (miembroError) {
    // Rollback manual: borra la empresa para no dejar huérfanas
    await admin.from('empresas').delete().eq('id', empresa.id)
    return { ok: false, error: miembroError.message }
  }

  return { ok: true, empresaId: empresa.id }
}
