/**
 * Obralia - OCR de facturas con Google Gemini
 *
 * Usa gemini-1.5-flash con responseSchema (structured output nativo) para
 * extraer cabecera y líneas de una factura (PDF o imagen). Gemini 1.5 Flash
 * tiene free tier de 1.500 requests/día sin tarjeta.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import {
  facturaExtraidaSchema,
  type FacturaExtraida,
} from '@/schemas/factura'

const MODEL = 'gemini-2.0-flash'

const SYSTEM_INSTRUCTION = `Eres un asistente especializado en extraer datos de facturas de material de obra y construcción en España.

Reglas:
- Devuelve SOLO datos que aparezcan visiblemente en la factura. Si un campo no es legible o no existe, devuelve null.
- Las líneas son los productos/materiales del cuerpo de la factura. Ignora subtotales, descuentos globales, totales y cuotas de IVA agregadas.
- Para "precio_unitario" e "importe_linea" usa SIEMPRE valores SIN IVA si la factura desglosa la base.
- Tipos de IVA en España: 0, 4, 10 o 21. Si la línea no muestra el tipo, devuelve null.
- Cantidades y precios: número decimal con punto. Convierte comas a puntos.
- Fechas: formato YYYY-MM-DD. Normaliza si vienen en otro formato.
- Unidades: copia literal del documento (ej: "ud", "m2", "saco 25kg", "kg").
- "codigo_articulo": referencia interna del proveedor si aparece (ej: "PL3045"). Null si no.
- Idioma: facturas en español o catalán. Mantén las descripciones tal cual.`

// Schema en formato Gemini (JSON Schema simplificado).
// Gemini no admite null en `type`, así que los campos opcionales usan `nullable: true`.
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    proveedor_nombre: { type: SchemaType.STRING, nullable: true },
    proveedor_nif: { type: SchemaType.STRING, nullable: true },
    numero_factura: { type: SchemaType.STRING, nullable: true },
    fecha_factura: {
      type: SchemaType.STRING,
      description: 'Formato YYYY-MM-DD',
      nullable: true,
    },
    total_sin_iva: { type: SchemaType.NUMBER, nullable: true },
    total_iva: { type: SchemaType.NUMBER, nullable: true },
    total_con_iva: { type: SchemaType.NUMBER, nullable: true },
    moneda: { type: SchemaType.STRING, nullable: true },
    lineas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          codigo_articulo: { type: SchemaType.STRING, nullable: true },
          descripcion: { type: SchemaType.STRING },
          cantidad: { type: SchemaType.NUMBER, nullable: true },
          unidad: { type: SchemaType.STRING, nullable: true },
          precio_unitario: { type: SchemaType.NUMBER, nullable: true },
          importe_linea: { type: SchemaType.NUMBER, nullable: true },
          tipo_iva: {
            type: SchemaType.INTEGER,
            description: 'IVA: 0, 4, 10 o 21. Null si no se indica.',
            nullable: true,
          },
        },
        required: ['descripcion'],
      },
    },
  },
  required: ['lineas'],
} as const

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY no está configurada')
  return new GoogleGenerativeAI(apiKey)
}

function normalizeMimeType(mimeType: string): string {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]
  if (allowed.includes(mimeType)) return mimeType
  return 'image/jpeg'
}

export async function extraerFactura(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<FacturaExtraida> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA as never,
      temperature: 0,
      maxOutputTokens: 8192,
    },
  })

  const base64 = Buffer.from(bytes).toString('base64')
  const mt = normalizeMimeType(mimeType)

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: mt,
      },
    },
    {
      text: 'Extrae todos los datos estructurados de esta factura siguiendo el schema indicado.',
    },
  ])

  const text = result.response.text()
  if (!text) throw new Error('Respuesta vacía del modelo')

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (e) {
    throw new Error(
      `El modelo no devolvió JSON válido: ${e instanceof Error ? e.message : 'desconocido'}`,
    )
  }

  const parsed = facturaExtraidaSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error(
      `Salida del modelo no cumple el schema: ${parsed.error.message}`,
    )
  }
  return parsed.data
}
