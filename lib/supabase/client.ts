import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createDemoClient, isDemoMode } from './demo-client'

export function createClient(): SupabaseClient<Database> {
  if (isDemoMode()) {
    return createDemoClient() as unknown as SupabaseClient<Database>
  }
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
