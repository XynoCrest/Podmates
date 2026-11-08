import 'react-native-url-polyfill/auto'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { DbClient } from '@podmates/db'
import { AppState, Platform } from 'react-native'
import { env } from './env'

/**
 * The app's Supabase client (publishable key + the user's session → RLS applies).
 * When env is missing the root layout shows a setup screen and nothing calls this.
 */
export const supabase: DbClient = env
  ? createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as DbClient)

// Refresh tokens only while the app is foregrounded (Supabase's React Native guidance).
if (env && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
