/**
 * Public app configuration. Everything here is compiled into the binary and
 * readable by anyone — never put a secret behind EXPO_PUBLIC_.
 *
 * Expo only inlines `process.env.EXPO_PUBLIC_*` when referenced literally,
 * so each key is spelled out below. There are deliberately NO fallback URLs:
 * a missing value shows a setup screen instead of silently hitting a real server.
 */
import { z } from 'zod'

const EnvSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['local', 'staging', 'prod']),
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  EXPO_PUBLIC_API_URL: z.url(),
})

export type AppEnv = z.infer<typeof EnvSchema>

const parsed = EnvSchema.safeParse({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
})

/** null when misconfigured — the root layout then renders <ConfigError />. */
export const env: AppEnv | null = parsed.success ? parsed.data : null

export const envProblems: string[] = parsed.success
  ? []
  : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)

export const isLocal = env?.EXPO_PUBLIC_APP_ENV === 'local'
