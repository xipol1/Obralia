import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const secret = request.headers.get('x-setup-secret')
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceRoleClient()
  const results: Record<string, string> = {}

  const buckets = [
    { id: 'logos', name: 'logos', public: true, fileSizeLimit: 5242880 },
    { id: 'presupuestos', name: 'presupuestos', public: false, fileSizeLimit: 10485760 },
    { id: 'firmas', name: 'firmas', public: false, fileSizeLimit: 5242880 },
    { id: 'facturas', name: 'facturas', public: false, fileSizeLimit: 20971520 },
  ]

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
    })
    if (error) {
      if (error.message?.includes('already exists')) {
        results[bucket.id] = 'already exists'
      } else {
        results[bucket.id] = `error: ${error.message}`
      }
    } else {
      results[bucket.id] = 'created'
    }
  }

  return NextResponse.json({ success: true, buckets: results })
}
