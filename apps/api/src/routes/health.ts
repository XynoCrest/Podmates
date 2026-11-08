import type { HealthResponse } from '@podmates/shared'
import { Router } from 'express'

/** Cheap, dependency-free liveness probe. */
export function healthRouter(info: { env: string; worker: boolean }) {
  const router = Router()
  router.get('/health', (_req, res) => {
    const body: HealthResponse = { ok: true, service: 'podmates-api', env: info.env, worker: info.worker }
    res.json(body)
  })
  return router
}
