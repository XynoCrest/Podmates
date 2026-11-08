import { supabase } from './supabase'

/**
 * snaps.image holds either a storage path in the `snaps` bucket or an absolute
 * URL (seed data). Resolve to something <Image> can load.
 */
export function imageUri(image: string | null | undefined): string | undefined {
  if (!image) return undefined
  if (/^https?:\/\//.test(image)) return image
  return supabase.storage.from('snaps').getPublicUrl(image).data.publicUrl
}
