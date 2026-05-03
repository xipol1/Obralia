import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function siguienteNumero(
  supabase: SupabaseClient<Database>,
  empresaId: string,
  tipo: 'presupuesto' | 'factura',
  ejercicio?: number,
): Promise<string> {
  const year = ejercicio ?? new Date().getFullYear()

  const { data, error } = await supabase.rpc('siguiente_numero', {
    p_empresa_id: empresaId,
    p_tipo: tipo,
    p_ejercicio: year,
  })

  if (error) throw new Error(`Error generando número: ${error.message}`)
  return data as string
}
