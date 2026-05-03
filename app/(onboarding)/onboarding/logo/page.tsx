'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

export default function OnboardingLogoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Fetch empresa_id for current user
  useEffect(() => {
    async function fetchEmpresaId() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('miembros')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setEmpresaId(data.empresa_id)
      }
    }
    fetchEmpresaId()
  }, [supabase])

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      return
    }
    setFile(selectedFile)
    const url = URL.createObjectURL(selectedFile)
    setPreview(url)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleFile(droppedFile)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
  }

  async function handleUpload() {
    if (!file || !empresaId) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${empresaId}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        toast({
          title: 'Error al subir el logo',
          description: uploadError.message,
          variant: 'destructive',
        })
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(path)

      // Update empresa with logo_url
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

      router.push('/onboarding/plan')
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Intentalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          ¿Tienes logo?
        </h1>
        <p className="mt-1 text-sm text-[--color-muted-foreground]">
          Aparecerá en tus presupuestos y documentos
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-[--radius] border-2 border-dashed p-10 transition-colors ${
          dragging
            ? 'border-[--color-accent] bg-[--color-accent]/10'
            : 'border-[--color-border] bg-[--color-card] hover:border-[--color-accent]/60 hover:bg-[--color-accent]/5'
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Vista previa del logo"
            className="max-h-40 max-w-full rounded-[--radius] object-contain"
          />
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[--color-accent]/15">
              {dragging ? (
                <ImageIcon className="h-8 w-8 text-[--color-accent]" />
              ) : (
                <Upload className="h-8 w-8 text-[--color-accent]" />
              )}
            </div>
            <p className="text-base font-semibold text-[--color-foreground]">
              Arrastra tu logo aquí
            </p>
            <p className="mt-1 text-sm text-[--color-muted-foreground]">
              o pulsa para seleccionar un archivo
            </p>
            <p className="mt-3 text-xs text-[--color-muted-foreground]">
              PNG, JPG o SVG · máx. 5 MB
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <button
          type="button"
          onClick={() => {
            setFile(null)
            setPreview(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          className="block w-full text-center text-sm font-medium text-[--color-muted-foreground] underline hover:text-[--color-foreground]"
        >
          Cambiar imagen
        </button>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          size="lg"
          className="w-full"
        >
          {uploading ? 'Subiendo...' : 'Siguiente'}
        </Button>
        <button
          type="button"
          onClick={() => router.push('/onboarding/plan')}
          className="text-sm font-medium text-[--color-muted-foreground] hover:text-[--color-foreground]"
        >
          Saltar este paso
        </button>
      </div>
    </div>
  )
}
