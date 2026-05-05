/**
 * Obralia - OCR de facturas con Claude vision
 *
 * Recibe los bytes de una factura (PDF o imagen), llama al modelo con
 * tool_use para forzar salida estructurada y devuelve un objeto validado
 * por zod. Si la salida no cumple el schema, lanza error con detalle.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  facturaExtraidaSchema,
  type FacturaExtraida,
} from '@/schemas/factura'

const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `Eres un asistente especializado en extraer datos de facturas de material de obra y construcción en España.

Recibes una factura (PDF o imagen). Tu tarea es devolver un JSON estricto con la cabecera y todas las líneas de detalle.

Reglas:
- Devuelve SOLO datos que aparezcan visiblemente en la factura. Si un campo no es legible o no existe, devuelve null.
- Las líneas son los productos/materiales del cuerpo de la factura. Ignora subtotales, descuentos globales, totales y cuotas de IVA agregadas.
- Para "precio_unitario" e "importe_linea" usa SIEMPRE valores SIN IVA si la factura desglosa la base, o el valor que se muestre como "precio neto"/"PVP neto".
- Tipos de IVA en España: 0, 4, 10 o 21. Si la línea no muestra el tipo, devuelve null.
- Cantidades y precios: número decimal con punto. Convierte comas a puntos.
- Fechas: formato YYYY-MM-DD. Si solo hay día/mes/año en otro formato, normaliza.
- Unidades: copia literal del documento (ej: "ud", "m2", "saco 25kg", "kg").
- "codigo_articulo": referencia interna del proveedor si aparece (ej: "PL3045"). Null si no.
- Idioma: facturas suelen estar en español pero también pueden venir en catalán. Mantén las descripciones tal cual.

Llama a la herramienta extraer_factura con el resultado. No incluyas explicaciones ni texto adicional.`

const TOOL_NAME = 'extraer_factura'

const TOOL_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    proveedor_nombre: { type: ['string', 'null'] },
    proveedor_nif: { type: ['string', 'null'] },
    numero_factura: { type: ['string', 'null'] },
    fecha_factura: {
      type: ['string', 'null'],
      description: 'Formato YYYY-MM-DD',
    },
    total_sin_iva: { type: ['number', 'null'] },
    total_iva: { type: ['number', 'null'] },
    total_con_iva: { type: ['number', 'null'] },
    moneda: { type: ['string', 'null'] },
    lineas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          codigo_articulo: { type: ['string', 'null'] },
          descripcion: { type: 'string' },
          cantidad: { type: ['number', 'null'] },
          unidad: { type: ['string', 'null'] },
          precio_unitario: { type: ['number', 'null'] },
          importe_linea: { type: ['number', 'null'] },
          tipo_iva: {
            type: ['integer', 'null'],
            enum: [0, 4, 10, 21, null],
          },
        },
        required: ['descripcion'],
      },
    },
  },
  required: ['lineas'],
} as const

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada')
  return new Anthropic({ apiKey })
}

function buildContent(
  bytes: ArrayBuffer,
  mimeType: string,
): Anthropic.MessageCreateParams['messages'][number]['content'] {
  const base64 = Buffer.from(bytes).toString('base64')

  if (mimeType === 'application/pdf') {
    return [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      },
      {
        type: 'text',
        text: 'Extrae todos los datos de esta factura llamando a la herramienta extraer_factura.',
      },
    ]
  }

  // Imagen
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
  type AllowedMime = (typeof allowed)[number]
  const mt: AllowedMime = (allowed.includes(mimeType as AllowedMime)
    ? mimeType
    : 'image/jpeg') as AllowedMime

  return [
    {
      type: 'image',
      source: { type: 'base64', media_type: mt, data: base64 },
    },
    {
      type: 'text',
      text: 'Extrae todos los datos de esta factura llamando a la herramienta extraer_factura.',
    },
  ]
}

export async function extraerFactura(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<FacturaExtraida> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description: 'Devuelve los datos estructurados extraídos de la factura',
        input_schema: TOOL_INPUT_SCHEMA as never,
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: buildContent(bytes, mimeType) }],
  })

  const toolUse = response.content.find(
    (block): block is Extract<typeof block, { type: 'tool_use' }> =>
      block.type === 'tool_use',
  )

  if (!toolUse) {
    throw new Error('El modelo no devolvió tool_use')
  }

  const parsed = facturaExtraidaSchema.safeParse(toolUse.input)
  if (!parsed.success) {
    throw new Error(
      `Salida del modelo no cumple el schema: ${parsed.error.message}`,
    )
  }
  return parsed.data
}
