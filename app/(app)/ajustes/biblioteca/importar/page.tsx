import { redirect } from 'next/navigation'

// La sección "Importar facturas" se unificó en /facturas?tab=recibidas.
// Mantenemos esta ruta como redirect para no romper enlaces existentes
// (la pantalla de detalle [id] sigue viviendo aquí — sólo el listado se mudó).
export default function ImportarFacturasRedirect() {
  redirect('/facturas?tab=recibidas')
}
