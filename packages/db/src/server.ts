/**
 * Server-only client factory. Uses the SECRET key, which bypasses RLS.
 * Never import this from apps/mobile — import from
 * '@podmates/db' (types only) there instead.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createAdminClient(url: string, secretKey: string) {
  if ('window' in globalThis) {
    throw new Error('createAdminClient must never run in a browser or app bundle')
  }
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
