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

  const message = (err: unknown) => (err instanceof Error ? err.message : String(err))

  async function tick() {
    // Pods and pairs settle separately, and one failing pod or pair is logged and skipped,
    // so a single bad row can't stop every tree from updating.
    try {
      const settled = await services.settle({ onError: (podId, err) => log.error('pod settlement failed', { podId, err: message(err) }) })
      if (settled.length) log.info(`settled ${settled.length} pod-day(s)`, { days: settled.map((d) => `${d.podDate}:${d.outcome}`) })
    } catch (err) {
      log.error('pod settlement failed — is Supabase running? (npm run db:start)', { err: message(err) })
    }
    try {
      const pairDays = await services.settlePairs({ onError: (pair, err) => log.error('pair settlement failed', { pair, err: message(err) }) })
      if (pairDays) log.info(`settled ${pairDays} podmate pair-day(s)`)
    } catch (err) {
      log.error('pair settlement failed — is Supabase running? (npm run db:start)', { err: message(err) })
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
