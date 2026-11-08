import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type { Database, Json } from './database.types'
export type DbClient = SupabaseClient<Database>

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']
