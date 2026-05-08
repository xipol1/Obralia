import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'

interface PresupuestoPDFProps {
  empresa: {
    razon_social: string
    nif: string
    direccion?: string | null
    codigo_postal?: string | null
    municipio?: string | null
    provincia?: string | null
    email?: string | null
    telefono?: string | null
    logo_url?: string | null
  }
  cliente: {
    nombre?: string | null
    apellidos?: string | null
    razon_social?: string | null
    nif?: string | null
    direccion?: string | null
    telefono?: string | null
  }
  presupuesto: {
    numero: string
    titulo?: string | null
    direccion_obra?: string | null
    fecha_emision: string
    fecha_validez?: string | null
    tipo_iva_default: number
    motivo_iva_reducido?: string | null
    base_imponible: number
    cuota_iva: number
    total: number
    notas_cliente?: string | null
    exclusiones?: string | null
    forma_pago?: string | null
    plazo_ejecucion_dias?: number | null
    garantia_meses?: number | null
    retencion_pct?: number | null
    retencion_importe?: number | null
    inversion_sujeto_pasivo?: boolean | null
    motivo_isp?: string | null
    total_a_cobrar?: number | null
  }
  partidas: Array<{
    descripcion: string
    unidad: string
    cantidad: number
    precio_unitario: number
    importe: number
    capitulo_id?: string | null
  }>
  capitulos?: Array<{
    id: string
    nombre: string
    orden: number
  }>
}

const UNIDAD_DISPLAY: Record<string, string> = {
  m2: 'm²',
  m3: 'm³',
  ml: 'ml',
  ud: 'ud',
  h: 'h',
  kg: 'kg',
  pa: 'p.a.',
}

function eur(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function formatFecha(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const BLUE = '#2563EB'
const GRAY_BORDER = '#E5E7EB'
const GRAY_TEXT = '#6B7280'
const GRAY_BG = '#F9FAFB'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 50,
    objectFit: 'contain' as const,
  },
  empresaInfo: {
    textAlign: 'right' as const,
  },
  empresaNombre: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    marginBottom: 4,
  },
  smallText: {
    fontSize: 8,
    color: GRAY_TEXT,
    marginBottom: 1,
  },
  // Client block
  clientBlock: {
    backgroundColor: GRAY_BG,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  clientLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_TEXT,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clientNombre: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  // Presupuesto info row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    paddingBottom: 12,
  },
  infoItem: {
    alignItems: 'center' as const,
  },
  infoLabel: {
    fontSize: 7,
    color: GRAY_TEXT,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  // Title
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: GRAY_TEXT,
    marginBottom: 16,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_BORDER,
  },
  tableRowAlt: {
    backgroundColor: GRAY_BG,
  },
  colDesc: { width: '40%' },
  colUd: { width: '10%', textAlign: 'center' as const },
  colCant: { width: '12%', textAlign: 'right' as const },
  colPrecio: { width: '18%', textAlign: 'right' as const },
  colImporte: { width: '20%', textAlign: 'right' as const },
  // Capítulo header
  capituloHeader: {
    backgroundColor: GRAY_BG,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  capituloNombre: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  capituloSubtotal: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_TEXT,
  },
  capituloSubtotalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    backgroundColor: '#FFFFFF',
  },
  capituloSubtotalLabel: {
    fontSize: 8,
    color: GRAY_TEXT,
    marginRight: 12,
  },
  capituloSubtotalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  // Totals
  totalsBlock: {
    marginTop: 12,
    marginLeft: 'auto',
    width: '45%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: GRAY_TEXT,
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1.5,
    borderTopColor: '#111827',
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
  },
  motivoIva: {
    fontSize: 7,
    color: GRAY_TEXT,
    marginTop: 4,
  },
  // Footer sections
  footerSection: {
    marginTop: 16,
  },
  footerLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_TEXT,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  footerText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
  },
  // Bottom
  bottomBar: {
    position: 'absolute' as const,
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: GRAY_BORDER,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomText: {
    fontSize: 7,
    color: GRAY_TEXT,
    textAlign: 'center' as const,
  },
})

export default function PresupuestoPDF({
  empresa,
  cliente,
  presupuesto,
  partidas,
  capitulos,
}: PresupuestoPDFProps) {
  const clienteNombre = cliente.razon_social ||
    [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') ||
    ''

  // Agrupar partidas por capítulo. Si no hay capítulos definidos o todas las
  // partidas son legacy (capitulo_id null) → renderizar plano sin headers.
  const capitulosOrdenados = (capitulos ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
  const partidasPorCapitulo = new Map<string, typeof partidas>()
  const partidasSinCapitulo: typeof partidas = []
  for (const p of partidas) {
    if (p.capitulo_id) {
      const arr = partidasPorCapitulo.get(p.capitulo_id) ?? []
      arr.push(p)
      partidasPorCapitulo.set(p.capitulo_id, arr)
    } else {
      partidasSinCapitulo.push(p)
    }
  }
  const usarCapitulos =
    capitulosOrdenados.length > 0 && partidasPorCapitulo.size > 0

  const empresaDireccion = [
    empresa.direccion,
    empresa.codigo_postal,
    empresa.municipio,
    empresa.provincia,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {empresa.logo_url ? (
              <Image src={empresa.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.empresaNombre}>{empresa.razon_social}</Text>
            )}
          </View>
          <View style={styles.empresaInfo}>
            {empresa.logo_url && (
              <Text style={styles.empresaNombre}>{empresa.razon_social}</Text>
            )}
            <Text style={styles.smallText}>NIF: {empresa.nif}</Text>
            {empresaDireccion && (
              <Text style={styles.smallText}>{empresaDireccion}</Text>
            )}
            {empresa.telefono && (
              <Text style={styles.smallText}>Tel: {empresa.telefono}</Text>
            )}
            {empresa.email && (
              <Text style={styles.smallText}>{empresa.email}</Text>
            )}
          </View>
        </View>

        {/* Client block */}
        <View style={styles.clientBlock}>
          <Text style={styles.clientLabel}>Cliente</Text>
          {clienteNombre && <Text style={styles.clientNombre}>{clienteNombre}</Text>}
          {cliente.nif && <Text style={styles.smallText}>NIF: {cliente.nif}</Text>}
          {cliente.direccion && (
            <Text style={styles.smallText}>{cliente.direccion}</Text>
          )}
          {cliente.telefono && (
            <Text style={styles.smallText}>Tel: {cliente.telefono}</Text>
          )}
        </View>

        {/* Presupuesto info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>N.o presupuesto</Text>
            <Text style={styles.infoValue}>{presupuesto.numero}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha emision</Text>
            <Text style={styles.infoValue}>
              {formatFecha(presupuesto.fecha_emision)}
            </Text>
          </View>
          {presupuesto.fecha_validez && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Valido hasta</Text>
              <Text style={styles.infoValue}>
                {formatFecha(presupuesto.fecha_validez)}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        {presupuesto.titulo && (
          <Text style={styles.title}>{presupuesto.titulo}</Text>
        )}
        {presupuesto.direccion_obra && (
          <Text style={styles.subtitle}>{presupuesto.direccion_obra}</Text>
        )}

        {/* Partidas table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Descripcion
          </Text>
          <Text style={[styles.tableHeaderText, styles.colUd]}>Ud.</Text>
          <Text style={[styles.tableHeaderText, styles.colCant]}>Cant.</Text>
          <Text style={[styles.tableHeaderText, styles.colPrecio]}>Precio</Text>
          <Text style={[styles.tableHeaderText, styles.colImporte]}>
            Importe
          </Text>
        </View>

        {usarCapitulos ? (
          <>
            {capitulosOrdenados.map((cap) => {
              const ps = partidasPorCapitulo.get(cap.id) ?? []
              if (ps.length === 0) return null
              const subtotal = ps.reduce((s, p) => s + p.importe, 0)
              return (
                <View key={cap.id} wrap={false}>
                  <View style={styles.capituloHeader}>
                    <Text style={styles.capituloNombre}>{cap.nombre}</Text>
                    <Text style={styles.capituloSubtotal}>{eur(subtotal)}</Text>
                  </View>
                  {ps.map((p, i) => (
                    <View
                      key={i}
                      style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                    >
                      <Text style={styles.colDesc}>{p.descripcion}</Text>
                      <Text style={styles.colUd}>
                        {UNIDAD_DISPLAY[p.unidad] ?? p.unidad}
                      </Text>
                      <Text style={styles.colCant}>{p.cantidad}</Text>
                      <Text style={styles.colPrecio}>{eur(p.precio_unitario)}</Text>
                      <Text style={styles.colImporte}>{eur(p.importe)}</Text>
                    </View>
                  ))}
                  <View style={styles.capituloSubtotalRow}>
                    <Text style={styles.capituloSubtotalLabel}>
                      Subtotal {cap.nombre}
                    </Text>
                    <Text style={styles.capituloSubtotalValue}>
                      {eur(subtotal)}
                    </Text>
                  </View>
                </View>
              )
            })}
            {partidasSinCapitulo.length > 0 && (
              <View wrap={false}>
                <View style={styles.capituloHeader}>
                  <Text style={styles.capituloNombre}>Sin agrupar</Text>
                  <Text style={styles.capituloSubtotal}>
                    {eur(partidasSinCapitulo.reduce((s, p) => s + p.importe, 0))}
                  </Text>
                </View>
                {partidasSinCapitulo.map((p, i) => (
                  <View
                    key={i}
                    style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                  >
                    <Text style={styles.colDesc}>{p.descripcion}</Text>
                    <Text style={styles.colUd}>
                      {UNIDAD_DISPLAY[p.unidad] ?? p.unidad}
                    </Text>
                    <Text style={styles.colCant}>{p.cantidad}</Text>
                    <Text style={styles.colPrecio}>{eur(p.precio_unitario)}</Text>
                    <Text style={styles.colImporte}>{eur(p.importe)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          partidas.map((p, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colDesc}>{p.descripcion}</Text>
              <Text style={styles.colUd}>
                {UNIDAD_DISPLAY[p.unidad] ?? p.unidad}
              </Text>
              <Text style={styles.colCant}>{p.cantidad}</Text>
              <Text style={styles.colPrecio}>{eur(p.precio_unitario)}</Text>
              <Text style={styles.colImporte}>{eur(p.importe)}</Text>
            </View>
          ))
        )}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Base imponible</Text>
            <Text style={styles.totalsValue}>
              {eur(presupuesto.base_imponible)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>
              IVA {presupuesto.tipo_iva_default}%
              {presupuesto.inversion_sujeto_pasivo ? ' (no se cobra · ISP)' : ''}
            </Text>
            <Text style={styles.totalsValue}>
              {presupuesto.inversion_sujeto_pasivo
                ? '—'
                : eur(presupuesto.cuota_iva)}
            </Text>
          </View>
          {!!presupuesto.retencion_pct && presupuesto.retencion_pct > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Retención IRPF {presupuesto.retencion_pct}%
              </Text>
              <Text style={styles.totalsValue}>
                −{eur(presupuesto.retencion_importe ?? 0)}
              </Text>
            </View>
          )}
          {presupuesto.motivo_iva_reducido && !presupuesto.inversion_sujeto_pasivo && (
            <Text style={styles.motivoIva}>
              {presupuesto.motivo_iva_reducido}
            </Text>
          )}
          {presupuesto.inversion_sujeto_pasivo && (
            <Text style={styles.motivoIva}>
              {presupuesto.motivo_isp ||
                'Operación con inversión del sujeto pasivo conforme al art. 84.Uno.2.f LIVA. El destinatario es el sujeto pasivo.'}
            </Text>
          )}
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>
              {presupuesto.inversion_sujeto_pasivo ||
              (presupuesto.retencion_pct ?? 0) > 0
                ? 'Total a cobrar'
                : 'Total'}
            </Text>
            <Text style={styles.totalFinalValue}>
              {eur(presupuesto.total_a_cobrar ?? presupuesto.total)}
            </Text>
          </View>
        </View>

        {/* Footer sections */}
        {presupuesto.notas_cliente && (
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>Notas</Text>
            <Text style={styles.footerText}>{presupuesto.notas_cliente}</Text>
          </View>
        )}

        {presupuesto.exclusiones && (
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>Exclusiones</Text>
            <Text style={styles.footerText}>{presupuesto.exclusiones}</Text>
          </View>
        )}

        {presupuesto.forma_pago && (
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>Forma de pago</Text>
            <Text style={styles.footerText}>{presupuesto.forma_pago}</Text>
          </View>
        )}

        {presupuesto.plazo_ejecucion_dias && (
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>Plazo de ejecucion</Text>
            <Text style={styles.footerText}>
              {presupuesto.plazo_ejecucion_dias} dias
            </Text>
          </View>
        )}

        {presupuesto.garantia_meses && (
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>Garantia</Text>
            <Text style={styles.footerText}>
              {presupuesto.garantia_meses} meses
            </Text>
          </View>
        )}

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.bottomText}>
            {empresa.razon_social} | NIF: {empresa.nif}
            {empresaDireccion ? ` | ${empresaDireccion}` : ''}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
