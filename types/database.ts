/**
 * Obralia - Database Types (placeholder)
 *
 * Manually typed to match the SQL schema in 00001_initial_schema.sql.
 * Replace with `supabase gen types typescript` once connected.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Enum de capítulos del sistema (Sesión 2 - ADR-002).
 * Lista cerrada usada para etiquetar partidas de la biblioteca y permitir
 * filtrado coherente. Los nombres de capítulo dentro de un presupuesto
 * concreto siguen siendo texto libre (campo nombre en presupuesto_capitulos).
 */
export type CapituloSistema =
  | "demolicion"
  | "albanileria"
  | "fontaneria"
  | "electricidad"
  | "pintura"
  | "solado_alicatado"
  | "carpinteria"
  | "pladur_falsos_techos"
  | "climatizacion"
  | "cubiertas_fachadas"
  | "sanitarios_griferia"
  | "otros";

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          nombre_comercial: string | null;
          razon_social: string;
          nif: string;
          direccion: string | null;
          codigo_postal: string | null;
          municipio: string | null;
          provincia: string | null;
          email: string | null;
          telefono: string | null;
          web: string | null;
          logo_url: string | null;
          iban: string | null;
          regimen_fiscal: "estimacion_directa" | "estimacion_objetiva";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "trial" | "basico" | "pro" | "equipo";
          trial_ends_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          nombre_comercial?: string | null;
          razon_social: string;
          nif: string;
          direccion?: string | null;
          codigo_postal?: string | null;
          municipio?: string | null;
          provincia?: string | null;
          email?: string | null;
          telefono?: string | null;
          web?: string | null;
          logo_url?: string | null;
          iban?: string | null;
          regimen_fiscal?: "estimacion_directa" | "estimacion_objetiva";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "trial" | "basico" | "pro" | "equipo";
          trial_ends_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          nombre_comercial?: string | null;
          razon_social?: string;
          nif?: string;
          direccion?: string | null;
          codigo_postal?: string | null;
          municipio?: string | null;
          provincia?: string | null;
          email?: string | null;
          telefono?: string | null;
          web?: string | null;
          logo_url?: string | null;
          iban?: string | null;
          regimen_fiscal?: "estimacion_directa" | "estimacion_objetiva";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "trial" | "basico" | "pro" | "equipo";
          trial_ends_at?: string | null;
        };
        Relationships: [];
      };
      miembros: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          user_id: string;
          rol: "owner" | "admin" | "usuario";
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          user_id: string;
          rol?: "owner" | "admin" | "usuario";
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          user_id?: string;
          rol?: "owner" | "admin" | "usuario";
        };
        Relationships: [
          {
            foreignKeyName: "miembros_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          tipo: "particular" | "empresa";
          tipo_fiscal:
            | "particular"
            | "autonomo"
            | "empresa"
            | "comunidad"
            | "administracion";
          aplica_retencion_irpf: boolean;
          aplica_isp_construccion: boolean;
          contacto_nombre: string | null;
          contacto_telefono: string | null;
          contacto_email: string | null;
          administrador_nombre: string | null;
          administrador_email: string | null;
          direccion_facturacion: string | null;
          cp_facturacion: string | null;
          municipio_facturacion: string | null;
          provincia_facturacion: string | null;
          nombre: string | null;
          apellidos: string | null;
          razon_social: string | null;
          nif: string | null;
          email: string | null;
          telefono: string | null;
          direccion: string | null;
          codigo_postal: string | null;
          municipio: string | null;
          provincia: string | null;
          notas: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          tipo?: "particular" | "empresa";
          tipo_fiscal?:
            | "particular"
            | "autonomo"
            | "empresa"
            | "comunidad"
            | "administracion";
          aplica_retencion_irpf?: boolean;
          aplica_isp_construccion?: boolean;
          contacto_nombre?: string | null;
          contacto_telefono?: string | null;
          contacto_email?: string | null;
          administrador_nombre?: string | null;
          administrador_email?: string | null;
          direccion_facturacion?: string | null;
          cp_facturacion?: string | null;
          municipio_facturacion?: string | null;
          provincia_facturacion?: string | null;
          nombre?: string | null;
          apellidos?: string | null;
          razon_social?: string | null;
          nif?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          codigo_postal?: string | null;
          municipio?: string | null;
          provincia?: string | null;
          notas?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          tipo?: "particular" | "empresa";
          tipo_fiscal?:
            | "particular"
            | "autonomo"
            | "empresa"
            | "comunidad"
            | "administracion";
          aplica_retencion_irpf?: boolean;
          aplica_isp_construccion?: boolean;
          contacto_nombre?: string | null;
          contacto_telefono?: string | null;
          contacto_email?: string | null;
          administrador_nombre?: string | null;
          administrador_email?: string | null;
          direccion_facturacion?: string | null;
          cp_facturacion?: string | null;
          municipio_facturacion?: string | null;
          provincia_facturacion?: string | null;
          nombre?: string | null;
          apellidos?: string | null;
          razon_social?: string | null;
          nif?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          codigo_postal?: string | null;
          municipio?: string | null;
          provincia?: string | null;
          notas?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      presupuestos: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          cliente_id: string | null;
          numero: string;
          fecha_emision: string;
          fecha_validez: string | null;
          estado:
            | "borrador"
            | "enviado"
            | "aceptado"
            | "rechazado"
            | "caducado";
          titulo: string | null;
          direccion_obra: string | null;
          tipo_iva_default: 0 | 4 | 10 | 21;
          motivo_iva_reducido: string | null;
          base_imponible: number;
          cuota_iva: number;
          total: number;
          notas_cliente: string | null;
          notas_internas: string | null;
          exclusiones: string | null;
          forma_pago: string | null;
          plazo_ejecucion_dias: number | null;
          garantia_meses: number | null;
          pdf_url: string | null;
          enviado_at: string | null;
          aceptado_at: string | null;
          firma_url: string | null;
          firma_cliente_nombre: string | null;
          firma_cliente_at: string | null;
          serie: string | null;
          retencion_pct: number;
          retencion_importe: number;
          inversion_sujeto_pasivo: boolean;
          motivo_isp: string | null;
          total_a_cobrar: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          cliente_id?: string | null;
          numero: string;
          fecha_emision?: string;
          fecha_validez?: string | null;
          estado?:
            | "borrador"
            | "enviado"
            | "aceptado"
            | "rechazado"
            | "caducado";
          titulo?: string | null;
          direccion_obra?: string | null;
          tipo_iva_default?: 0 | 4 | 10 | 21;
          motivo_iva_reducido?: string | null;
          base_imponible?: number;
          cuota_iva?: number;
          total?: number;
          notas_cliente?: string | null;
          notas_internas?: string | null;
          exclusiones?: string | null;
          forma_pago?: string | null;
          plazo_ejecucion_dias?: number | null;
          garantia_meses?: number | null;
          pdf_url?: string | null;
          enviado_at?: string | null;
          aceptado_at?: string | null;
          firma_url?: string | null;
          firma_cliente_nombre?: string | null;
          firma_cliente_at?: string | null;
          serie?: string | null;
          retencion_pct?: number;
          retencion_importe?: number;
          inversion_sujeto_pasivo?: boolean;
          motivo_isp?: string | null;
          total_a_cobrar?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          cliente_id?: string | null;
          numero?: string;
          fecha_emision?: string;
          fecha_validez?: string | null;
          estado?:
            | "borrador"
            | "enviado"
            | "aceptado"
            | "rechazado"
            | "caducado";
          titulo?: string | null;
          direccion_obra?: string | null;
          tipo_iva_default?: 0 | 4 | 10 | 21;
          motivo_iva_reducido?: string | null;
          base_imponible?: number;
          cuota_iva?: number;
          total?: number;
          notas_cliente?: string | null;
          notas_internas?: string | null;
          exclusiones?: string | null;
          forma_pago?: string | null;
          plazo_ejecucion_dias?: number | null;
          garantia_meses?: number | null;
          pdf_url?: string | null;
          enviado_at?: string | null;
          aceptado_at?: string | null;
          firma_url?: string | null;
          firma_cliente_nombre?: string | null;
          firma_cliente_at?: string | null;
          serie?: string | null;
          retencion_pct?: number;
          retencion_importe?: number;
          inversion_sujeto_pasivo?: boolean;
          motivo_isp?: string | null;
          total_a_cobrar?: number;
        };
        Relationships: [
          {
            foreignKeyName: "presupuestos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presupuestos_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      presupuesto_capitulos: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          presupuesto_id: string;
          orden: number;
          nombre: string;
          subtotal: number;
          capitulo_sistema: CapituloSistema | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          presupuesto_id: string;
          orden?: number;
          nombre: string;
          subtotal?: number;
          capitulo_sistema?: CapituloSistema | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          presupuesto_id?: string;
          orden?: number;
          nombre?: string;
          subtotal?: number;
          capitulo_sistema?: CapituloSistema | null;
        };
        Relationships: [
          {
            foreignKeyName: "presupuesto_capitulos_presupuesto_id_fkey";
            columns: ["presupuesto_id"];
            isOneToOne: false;
            referencedRelation: "presupuestos";
            referencedColumns: ["id"];
          },
        ];
      };
      presupuesto_partidas: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          presupuesto_id: string;
          capitulo_id: string | null;
          orden: number;
          descripcion: string;
          unidad: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          cantidad: number;
          precio_unitario: number;
          /** Generated column: cantidad * precio_unitario (read-only) */
          importe: number;
          tipo_iva: 0 | 4 | 10 | 21;
          coste_unitario_interno: number | null;
          notas: string | null;
          partida_biblioteca_id: string | null;
          capitulo_sistema: CapituloSistema | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          presupuesto_id: string;
          capitulo_id?: string | null;
          orden?: number;
          descripcion: string;
          unidad?: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          cantidad?: number;
          precio_unitario?: number;
          // importe is generated, not insertable
          tipo_iva?: 0 | 4 | 10 | 21;
          coste_unitario_interno?: number | null;
          notas?: string | null;
          partida_biblioteca_id?: string | null;
          capitulo_sistema?: CapituloSistema | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          presupuesto_id?: string;
          capitulo_id?: string | null;
          orden?: number;
          descripcion?: string;
          unidad?: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          cantidad?: number;
          precio_unitario?: number;
          // importe is generated, not updatable
          tipo_iva?: 0 | 4 | 10 | 21;
          coste_unitario_interno?: number | null;
          notas?: string | null;
          partida_biblioteca_id?: string | null;
          capitulo_sistema?: CapituloSistema | null;
        };
        Relationships: [
          {
            foreignKeyName: "presupuesto_partidas_presupuesto_id_fkey";
            columns: ["presupuesto_id"];
            isOneToOne: false;
            referencedRelation: "presupuestos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presupuesto_partidas_capitulo_id_fkey";
            columns: ["capitulo_id"];
            isOneToOne: false;
            referencedRelation: "presupuesto_capitulos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presupuesto_partidas_partida_biblioteca_id_fkey";
            columns: ["partida_biblioteca_id"];
            isOneToOne: false;
            referencedRelation: "partidas_biblioteca";
            referencedColumns: ["id"];
          },
        ];
      };
      partidas_biblioteca: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          empresa_id: string | null;
          origen: "sistema" | "empresa";
          capitulo: CapituloSistema;
          codigo: string | null;
          descripcion: string;
          unidad: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          precio_unitario_orientativo: number;
          tipo_iva_sugerido: 0 | 4 | 10 | 21;
          tags: string[];
          notas: string | null;
          activo: boolean;
          origen_biblioteca_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string | null;
          origen: "sistema" | "empresa";
          capitulo: CapituloSistema;
          codigo?: string | null;
          descripcion: string;
          unidad: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          precio_unitario_orientativo: number;
          tipo_iva_sugerido?: 0 | 4 | 10 | 21;
          tags?: string[];
          notas?: string | null;
          activo?: boolean;
          origen_biblioteca_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string | null;
          origen?: "sistema" | "empresa";
          capitulo?: CapituloSistema;
          codigo?: string | null;
          descripcion?: string;
          unidad?: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          precio_unitario_orientativo?: number;
          tipo_iva_sugerido?: 0 | 4 | 10 | 21;
          tags?: string[];
          notas?: string | null;
          activo?: boolean;
          origen_biblioteca_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partidas_biblioteca_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
      plantillas_obra: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          empresa_id: string | null;
          origen: "sistema" | "empresa";
          slug: string;
          nombre: string;
          descripcion: string | null;
          icono: string | null;
          tipo_iva_default: 0 | 4 | 10 | 21;
          titulo_sugerido: string | null;
          orden: number;
          activa: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string | null;
          origen: "sistema" | "empresa";
          slug: string;
          nombre: string;
          descripcion?: string | null;
          icono?: string | null;
          tipo_iva_default?: 0 | 4 | 10 | 21;
          titulo_sugerido?: string | null;
          orden?: number;
          activa?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string | null;
          origen?: "sistema" | "empresa";
          slug?: string;
          nombre?: string;
          descripcion?: string | null;
          icono?: string | null;
          tipo_iva_default?: 0 | 4 | 10 | 21;
          titulo_sugerido?: string | null;
          orden?: number;
          activa?: boolean;
        };
        Relationships: [];
      };
      plantilla_capitulos: {
        Row: {
          id: string;
          created_at: string;
          plantilla_id: string;
          orden: number;
          nombre: string;
          capitulo_sistema: CapituloSistema | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          plantilla_id: string;
          orden: number;
          nombre: string;
          capitulo_sistema?: CapituloSistema | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          plantilla_id?: string;
          orden?: number;
          nombre?: string;
          capitulo_sistema?: CapituloSistema | null;
        };
        Relationships: [
          {
            foreignKeyName: "plantilla_capitulos_plantilla_id_fkey";
            columns: ["plantilla_id"];
            isOneToOne: false;
            referencedRelation: "plantillas_obra";
            referencedColumns: ["id"];
          },
        ];
      };
      plantilla_partidas: {
        Row: {
          id: string;
          created_at: string;
          plantilla_id: string;
          plantilla_capitulo_id: string | null;
          partida_biblioteca_id: string | null;
          orden: number;
          descripcion: string;
          unidad: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          precio_unitario_orientativo: number;
          cantidad_sugerida: number;
          tipo_iva_sugerido: 0 | 4 | 10 | 21;
        };
        Insert: {
          id?: string;
          created_at?: string;
          plantilla_id: string;
          plantilla_capitulo_id?: string | null;
          partida_biblioteca_id?: string | null;
          orden: number;
          descripcion: string;
          unidad: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          precio_unitario_orientativo: number;
          cantidad_sugerida?: number;
          tipo_iva_sugerido?: 0 | 4 | 10 | 21;
        };
        Update: {
          id?: string;
          created_at?: string;
          plantilla_id?: string;
          plantilla_capitulo_id?: string | null;
          partida_biblioteca_id?: string | null;
          orden?: number;
          descripcion?: string;
          unidad?: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          precio_unitario_orientativo?: number;
          cantidad_sugerida?: number;
          tipo_iva_sugerido?: 0 | 4 | 10 | 21;
        };
        Relationships: [
          {
            foreignKeyName: "plantilla_partidas_plantilla_id_fkey";
            columns: ["plantilla_id"];
            isOneToOne: false;
            referencedRelation: "plantillas_obra";
            referencedColumns: ["id"];
          },
        ];
      };
      facturas: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          empresa_id: string;
          presupuesto_id: string | null;
          cliente_id: string | null;
          numero: string;
          fecha_emision: string | null;
          fecha_devengo: string | null;
          base_imponible: number | null;
          cuota_iva: number | null;
          total: number | null;
          retencion_irpf: number | null;
          estado:
            | "emitida"
            | "pagada"
            | "rectificada"
            | "parcial"
            | "vencida"
            | "anulada";
          pdf_url: string | null;
          titulo: string | null;
          direccion_obra: string | null;
          tipo_iva_default: 0 | 4 | 10 | 21 | null;
          motivo_iva_reducido: string | null;
          notas_cliente: string | null;
          notas_internas: string | null;
          forma_pago: string | null;
          serie: string | null;
          tipo_factura: "normal" | "rectificativa" | "anticipo" | "proforma" | "abono";
          factura_rectificada_id: string | null;
          motivo_rectificacion: string | null;
          anticipo_de_presupuesto_id: string | null;
          retencion_pct: number;
          retencion_importe: number;
          inversion_sujeto_pasivo: boolean;
          motivo_isp: string | null;
          total_a_cobrar: number;
          dias_pago: number | null;
          fecha_vencimiento: string | null;
          importe_cobrado: number;
          fecha_cobro: string | null;
          notas_cobro: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id: string;
          presupuesto_id?: string | null;
          cliente_id?: string | null;
          numero: string;
          fecha_emision?: string | null;
          fecha_devengo?: string | null;
          base_imponible?: number | null;
          cuota_iva?: number | null;
          total?: number | null;
          retencion_irpf?: number | null;
          estado?:
            | "emitida"
            | "pagada"
            | "rectificada"
            | "parcial"
            | "vencida"
            | "anulada";
          pdf_url?: string | null;
          titulo?: string | null;
          direccion_obra?: string | null;
          tipo_iva_default?: 0 | 4 | 10 | 21 | null;
          motivo_iva_reducido?: string | null;
          notas_cliente?: string | null;
          notas_internas?: string | null;
          forma_pago?: string | null;
          serie?: string | null;
          tipo_factura?: "normal" | "rectificativa" | "anticipo" | "proforma" | "abono";
          factura_rectificada_id?: string | null;
          motivo_rectificacion?: string | null;
          anticipo_de_presupuesto_id?: string | null;
          retencion_pct?: number;
          retencion_importe?: number;
          inversion_sujeto_pasivo?: boolean;
          motivo_isp?: string | null;
          total_a_cobrar?: number;
          dias_pago?: number | null;
          fecha_vencimiento?: string | null;
          importe_cobrado?: number;
          fecha_cobro?: string | null;
          notas_cobro?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          empresa_id?: string;
          presupuesto_id?: string | null;
          cliente_id?: string | null;
          numero?: string;
          fecha_emision?: string | null;
          fecha_devengo?: string | null;
          base_imponible?: number | null;
          cuota_iva?: number | null;
          total?: number | null;
          retencion_irpf?: number | null;
          estado?:
            | "emitida"
            | "pagada"
            | "rectificada"
            | "parcial"
            | "vencida"
            | "anulada";
          pdf_url?: string | null;
          titulo?: string | null;
          direccion_obra?: string | null;
          tipo_iva_default?: 0 | 4 | 10 | 21 | null;
          motivo_iva_reducido?: string | null;
          notas_cliente?: string | null;
          notas_internas?: string | null;
          forma_pago?: string | null;
          serie?: string | null;
          tipo_factura?: "normal" | "rectificativa" | "anticipo" | "proforma" | "abono";
          factura_rectificada_id?: string | null;
          motivo_rectificacion?: string | null;
          anticipo_de_presupuesto_id?: string | null;
          retencion_pct?: number;
          retencion_importe?: number;
          inversion_sujeto_pasivo?: boolean;
          motivo_isp?: string | null;
          total_a_cobrar?: number;
          dias_pago?: number | null;
          fecha_vencimiento?: string | null;
          importe_cobrado?: number;
          fecha_cobro?: string | null;
          notas_cobro?: string | null;
        };
        Relationships: [];
      };
      factura_capitulos: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          factura_id: string;
          orden: number;
          nombre: string;
          capitulo_sistema: CapituloSistema | null;
          subtotal: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          factura_id: string;
          orden?: number;
          nombre: string;
          capitulo_sistema?: CapituloSistema | null;
          subtotal?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          factura_id?: string;
          orden?: number;
          nombre?: string;
          capitulo_sistema?: CapituloSistema | null;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "factura_capitulos_factura_id_fkey";
            columns: ["factura_id"];
            isOneToOne: false;
            referencedRelation: "facturas";
            referencedColumns: ["id"];
          },
        ];
      };
      factura_partidas: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          factura_id: string;
          capitulo_id: string | null;
          partida_biblioteca_id: string | null;
          orden: number;
          descripcion: string;
          unidad: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          cantidad: number;
          precio_unitario: number;
          /** Generated column: cantidad * precio_unitario (read-only) */
          importe: number;
          tipo_iva: 0 | 4 | 10 | 21;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          factura_id: string;
          capitulo_id?: string | null;
          partida_biblioteca_id?: string | null;
          orden?: number;
          descripcion: string;
          unidad?: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          cantidad?: number;
          precio_unitario?: number;
          tipo_iva?: 0 | 4 | 10 | 21;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          factura_id?: string;
          capitulo_id?: string | null;
          partida_biblioteca_id?: string | null;
          orden?: number;
          descripcion?: string;
          unidad?: "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";
          cantidad?: number;
          precio_unitario?: number;
          tipo_iva?: 0 | 4 | 10 | 21;
        };
        Relationships: [
          {
            foreignKeyName: "factura_partidas_factura_id_fkey";
            columns: ["factura_id"];
            isOneToOne: false;
            referencedRelation: "facturas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factura_partidas_capitulo_id_fkey";
            columns: ["capitulo_id"];
            isOneToOne: false;
            referencedRelation: "factura_capitulos";
            referencedColumns: ["id"];
          },
        ];
      };
      contadores: {
        Row: {
          empresa_id: string;
          tipo: "presupuesto" | "factura";
          ejercicio: number;
          ultimo_numero: number;
        };
        Insert: {
          empresa_id: string;
          tipo: "presupuesto" | "factura";
          ejercicio: number;
          ultimo_numero?: number;
        };
        Update: {
          empresa_id?: string;
          tipo?: "presupuesto" | "factura";
          ejercicio?: number;
          ultimo_numero?: number;
        };
        Relationships: [];
      };
      eventos_audit: {
        Row: {
          id: string;
          created_at: string;
          empresa_id: string | null;
          user_id: string | null;
          entidad: string;
          entidad_id: string | null;
          accion: "create" | "update" | "send" | "delete";
          payload: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          empresa_id?: string | null;
          user_id?: string | null;
          entidad: string;
          entidad_id?: string | null;
          accion: "create" | "update" | "send" | "delete";
          payload?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          empresa_id?: string | null;
          user_id?: string | null;
          entidad?: string;
          entidad_id?: string | null;
          accion?: "create" | "update" | "send" | "delete";
          payload?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      mis_empresa_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      siguiente_numero: {
        Args: {
          p_empresa_id: string;
          p_tipo: string;
          p_ejercicio: number;
        };
        Returns: string;
      };
      duplicar_partida_a_empresa: {
        Args: {
          p_partida_id: string;
          p_empresa_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      capitulo_sistema: CapituloSistema;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience helpers (same pattern as supabase gen types)
type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
