import { createAdminClient } from '@podmates/db/server'
import { createApp } from './app'
import { loadEnv } from './env'
import { createLogger } from './lib/logger'
import { createSupabaseServices } from './services/supabaseServices'
import { startWorker } from './worker/loop'

const env = loadEnv()
const log = createLogger(env.LOG_LEVEL, env.APP_ENV !== 'local')
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
const services = createSupabaseServices(db)

const app = createApp({ services, log, env: env.APP_ENV, worker: env.RUN_WORKER, corsOrigins: env.CORS_ORIGINS })
const server = app.listen(env.PORT, '0.0.0.0', () => {
  log.info(`api listening on http://localhost:${env.PORT}`, { env: env.APP_ENV, supabase: env.SUPABASE_URL })
})

// The first tick also replays seeded history after a fresh `npm run db:reset`.
const worker = env.RUN_WORKER ? startWorker({ services, log, pollMs: env.SETTLE_POLL_MS }) : null

function shutdown(signal: string) {
  log.info(`${signal} received, shutting down`)
  worker?.stop()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 5000).unref()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
