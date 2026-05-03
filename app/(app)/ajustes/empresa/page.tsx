'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, ImageIcon } from 'lucide-react'
import {
  empresaUpdateSchema,
  type EmpresaUpdateFormData,
} from '@/schemas/empresa'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function EmpresaSettingsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpresaUpdateFormData>({
    resolver: zodResolver(empresaUpdateSchema),
  })

  useEffect(() => {
    async function fetchEmpresa() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: miembro } = await supabase
        .from('miembros')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (!miembro) return

      const { data: empresa } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', miembro.empresa_id)
        .single()

      if (empresa) {
        setEmpresaId(empresa.id)
        setLogoUrl(empresa.logo_url)
        reset({
          razon_social: empresa.razon_social,
          nif: empresa.nif,
          nombre_comercial: empresa.nombre_comercial || '',
          direccion: empresa.direccion || '',
          codigo_postal: empresa.codigo_postal || '',
          municipio: empresa.municipio || '',
          provincia: empresa.provincia || '',
          email: empresa.email || '',
          telefono: empresa.telefono || '',
          web: empresa.web || '',
          iban: empresa.iban || '',
          regimen_fiscal: empresa.regimen_fiscal,
        })
      }

      setLoading(false)
    }
    fetchEmpresa()
  }, [supabase, reset])

  const handleLogoFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return
    setLogoFile(selectedFile)
    setLogoPreview(URL.createObjectURL(selectedFile))
  }, [])

  async function handleLogoUpload() {
    if (!logoFile || !empresaId) return

    setUploadingLogo(true)
    try {
      const ext = logoFile.name.split('.').pop()
      const path = `${empresaId}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true })

      if (uploadError) {
        toast({
          title: 'Error al subir el logo',
          description: uploadError.message,
          variant: 'destructive',
        })
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: publicUrl })
        .eq('id', empresaId)

      if (updateError) {
        toast({
          title: 'Error al guardar el logo',
          description: updateError.message,
          variant: 'destructive',
        })
        return
      }

      setLogoUrl(publicUrl)
      setLogoFile(null)
      setLogoPreview(null)
      toast({ title: 'Logo actualizado correctamente' })
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Intentalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  async function onSubmit(data: EmpresaUpdateFormData) {
    if (!empresaId) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          razon_social: data.razon_social,
          nif: data.nif,
          nombre_comercial: data.nombre_comercial || null,
          direccion: data.direccion || null,
          codigo_postal: data.codigo_postal || null,
          municipio: data.municipio || null,
          provincia: data.provincia || null,
          email: data.email || null,
          telefono: data.telefono || null,
          web: data.web || null,
          iban: data.iban || null,
          regimen_fiscal: data.regimen_fiscal,
        })
        .eq('id', empresaId)

      if (error) {
        toast({
          title: 'Error al guardar',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Datos actualizados correctamente' })
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Intentalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/ajustes"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          Datos de empresa
        </h1>
      </div>

      {/* Logo section */}
      <Card className="p-5">
        <Label className="mb-3 block">Logo de la empresa</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-muted]">
            {logoPreview || logoUrl ? (
              <img
                src={logoPreview || logoUrl!}
                alt="Logo de la empresa"
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-[--color-muted-foreground]" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            {logoFile && (
              <Button
                size="sm"
                variant="accent"
                onClick={handleLogoUpload}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? 'Subiendo...' : 'Guardar logo'}
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleLogoFile(f)
          }}
          className="hidden"
        />
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Identificación
          </h2>
          <div className="space-y-2">
            <Label htmlFor="razon_social">
              Razón social <span className="text-red-500">*</span>
            </Label>
            <Input
              id="razon_social"
              placeholder="Construcciones García S.L."
              aria-invalid={!!errors.razon_social}
              {...register('razon_social')}
            />
            {errors.razon_social && (
              <p className="text-sm text-red-600">{errors.razon_social.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_comercial">Nombre comercial</Label>
            <Input
              id="nombre_comercial"
              placeholder="Reformas García"
              aria-invalid={!!errors.nombre_comercial}
              {...register('nombre_comercial')}
            />
            {errors.nombre_comercial && (
              <p className="text-sm text-red-600">
                {errors.nombre_comercial.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nif">
              NIF/CIF <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nif"
              placeholder="B12345678"
              aria-invalid={!!errors.nif}
              {...register('nif')}
            />
            {errors.nif && (
              <p className="text-sm text-red-600">{errors.nif.message}</p>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Dirección
          </h2>
        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            placeholder="C/ Mayor 10, 2o A"
            aria-invalid={!!errors.direccion}
            {...register('direccion')}
          />
          {errors.direccion && (
            <p className="text-sm text-red-600">{errors.direccion.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="codigo_postal">Codigo postal</Label>
            <Input
              id="codigo_postal"
              placeholder="28001"
              inputMode="numeric"
              aria-invalid={!!errors.codigo_postal}
              {...register('codigo_postal')}
            />
            {errors.codigo_postal && (
              <p className="text-sm text-red-600">
                {errors.codigo_postal.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Input
              id="municipio"
              placeholder="Madrid"
              aria-invalid={!!errors.municipio}
              {...register('municipio')}
            />
            {errors.municipio && (
              <p className="text-sm text-red-600">{errors.municipio.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provincia">Provincia</Label>
          <Input
            id="provincia"
            placeholder="Madrid"
            aria-invalid={!!errors.provincia}
            {...register('provincia')}
          />
          {errors.provincia && (
            <p className="text-sm text-red-600">{errors.provincia.message}</p>
          )}
        </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Contacto
          </h2>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="info@tuempresa.es"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            placeholder="612 345 678"
            inputMode="tel"
            aria-invalid={!!errors.telefono}
            {...register('telefono')}
          />
          {errors.telefono && (
            <p className="text-sm text-red-600">{errors.telefono.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="web">Web</Label>
          <Input
            id="web"
            placeholder="www.tuempresa.es"
            aria-invalid={!!errors.web}
            {...register('web')}
          />
          {errors.web && (
            <p className="text-sm text-red-600">{errors.web.message}</p>
          )}
        </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Datos fiscales
          </h2>
        <div className="space-y-2">
          <Label htmlFor="iban">IBAN</Label>
          <Input
            id="iban"
            placeholder="ES12 3456 7890 1234 5678 9012"
            aria-invalid={!!errors.iban}
            {...register('iban')}
          />
          {errors.iban && (
            <p className="text-sm text-red-600">{errors.iban.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="regimen_fiscal">Régimen fiscal</Label>
          <select
            id="regimen_fiscal"
            className="flex h-12 w-full rounded-[--radius] border border-[--color-border] bg-[--color-card] px-3 py-2 text-base text-[--color-foreground] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]/20"
            {...register('regimen_fiscal')}
          >
            <option value="estimacion_directa">Estimación directa</option>
            <option value="estimacion_objetiva">Estimación objetiva (módulos)</option>
          </select>
        </div>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  )
}
