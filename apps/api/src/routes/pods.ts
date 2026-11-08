import { Router, type Request } from 'express'
import { z } from 'zod'
import type { OpenWindowResponse, ReplantResponse, SettleResponse } from '@podmates/shared'
import { HttpError } from '../lib/httpError'
import { requireUser } from '../middleware/auth'
import type { Services } from '../services/types'

const PodParams = z.object({ id: z.uuid() })

export function podsRouter(services: Services, opts: { env: string }) {
  const router = Router()
  const auth = requireUser(services)

  async function memberPod(req: Request) {
    const { id } = PodParams.parse(req.params)
    if (!(await services.isPodMember(id, req.user!.id))) throw new HttpError('forbidden', 'Not a member of this pod')
    return id
  }

  /** Plant a fresh tree after the old one died. */
  router.post('/v1/pods/:id/replant', auth, async (req, res) => {
    const id = await memberPod(req)
    const body: ReplantResponse = await services.replant(id)
    res.json(body)
  })

  // ── Local demo helpers: never mounted outside APP_ENV=local ──
  if (opts.env === 'local') {
    /** Close today right now and settle it (so you can watch the tree react). */
    router.post('/v1/dev/pods/:id/end-day', auth, async (req, res) => {
      const id = await memberPod(req)
      const body: SettleResponse = { settled: await services.settle({ podId: id, throughToday: true }) }
      res.json(body)
    })

    /** Move the pod's snap window so it is open now. */
    router.post('/v1/dev/pods/:id/open-window', auth, async (req, res) => {
      const id = await memberPod(req)
      const body: OpenWindowResponse = await services.openWindowNow(id)
      res.json(body)
    })
  }

  return router
}
