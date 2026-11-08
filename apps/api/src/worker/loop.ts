import type { Logger } from '../lib/logger'
import type { Services } from '../services/types'

/**
 * Recomputes streaks whose day has ended and every tree's health, on a timer.
 * Users live in many timezones, so "midnight" happens all day long — polling is
 * simpler than scheduling, and settlement is idempotent (streaks are replayed from history).
 */
export function startWorker({ services, log, pollMs }: { services: Services; log: Logger; pollMs: number }) {
  let stopped = false
  let timer: NodeJS.Timeout | undefined

  async function tick() {
    try {
      const { streaks } = await services.settle()
      if (streaks) log.info(`settled ${streaks} streak(s)`)
    } catch (err) {
      log.error('settlement failed — is Supabase running? (npm run db:start)', { err: err instanceof Error ? err.message : String(err) })
    }
    if (!stopped) timer = setTimeout(tick, pollMs)
  }
  void tick()

  return {
    stop() {
      stopped = true
      clearTimeout(timer)
    },
  }
}
