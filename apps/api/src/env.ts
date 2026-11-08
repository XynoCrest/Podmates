/**
 * Environment contract. Fails loudly at boot: there are NO fallback URLs or
 * keys anywhere in this service, so a missing var can never silently point
 * local development at staging or production.
 * Keep .env.example in sync — a test checks every key below appears there.
 */
import { z } from 'zod'

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1')

export const EnvSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'staging', 'prod']),
  PORT: z.coerce.number().int().positive().default(4100),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  RUN_WORKER: bool.default(true),
  SETTLE_POLL_MS: z.coerce.number().int().min(1000).default(60_000),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type Env = z.infer<typeof EnvSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    console.error(`\n[env] Invalid environment for apps/api:\n${problems}\n\nSee apps/api/.env.example (or run \`npm run env:local\` at the repo root).\n`)
    process.exit(1)
  }
  return parsed.data
}
