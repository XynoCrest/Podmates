import { Router, type Request } from 'express'
import { z } from 'zod'
import type { PairReplantResponse, PairSettleResponse } from '@podmates/shared'
import { HttpError } from '../lib/httpError'
import { requireUser } from '../middleware/auth'
import type { Services } from '../services/types'

const PodmateParams = z.object({ id: z.uuid() })

/** A podmate pair's tree: `:id` is the other person. */
export function podmatesRouter(services: Services, opts: { env: string }) {
  const router = Router()
  const auth = requireUser(services)

  async function podmate(req: Request) {
    const { id } = PodmateParams.parse(req.params)
    if (!(await services.arePodmates(req.user!.id, id))) throw new HttpError('forbidden', 'You do not share a pod with this person')
    return id
  }

  /** Plant a fresh pair tree after the old one died. */
  router.post('/v1/podmates/:id/replant', auth, async (req, res) => {
    const id = await podmate(req)
    const body: PairReplantResponse = await services.replantPair(req.user!.id, id)
    res.json(body)
  })

  // ── Local demo helper: never mounted outside APP_ENV=local ──
  if (opts.env === 'local') {
    /** Close today right now and settle this pair's tree. */
    router.post('/v1/dev/podmates/:id/end-day', auth, async (req, res) => {
      const id = await podmate(req)
      const body: PairSettleResponse = { settled: await services.settlePairs({ pair: [req.user!.id, id], throughToday: true }) }
      res.json(body)
    })
  }

  return router
}
