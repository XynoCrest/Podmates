import type { Logger } from '../lib/logger'
import type { Services } from '../services/types'

/**
 * Settles every pod-day that has ended, on a timer. Pods live in many
 * timezones, so "midnight" happens all day long — polling is simpler than
 * scheduling, and settlement is idempotent (guarded per day in SQL).
 */
export function startWorker({ services, log, pollMs }: { services: Services; log: Logger; pollMs: number }) {
  let stopped = false
  let timer: NodeJS.Timeout | undefined

  async function tick() {
    try {
      const settled = await services.settle()
      if (settled.length) log.info(`settled ${settled.length} pod-day(s)`, { days: settled.map((d) => `${d.podDate}:${d.outcome}`) })
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
