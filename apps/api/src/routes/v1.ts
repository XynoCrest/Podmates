import { Router, type Request } from 'express'
import { z } from 'zod'
import { ReviewRequest, type FlaggedResponse, type ReviewResponse, type SettleResponse } from '@podmates/shared'
import { HttpError } from '../lib/httpError'
import { requireUser } from '../middleware/auth'
import type { Services } from '../services/types'

const SnapParams = z.object({ id: z.uuid() })

export function v1Router(services: Services, opts: { env: string }) {
  const router = Router()
  const auth = requireUser(services)

  async function requireAdmin(req: Request) {
    if (!(await services.isAdmin(req.user!.id))) throw new HttpError('forbidden', 'Podmates team only')
  }

  // ── Team review of snaps hidden by flags ──
  router.get('/v1/admin/flagged', auth, async (req, res) => {
    await requireAdmin(req)
    const body: FlaggedResponse = { snaps: await services.flaggedSnaps() }
    res.json(body)
  })

  router.post('/v1/admin/snaps/:id/review', auth, async (req, res) => {
    await requireAdmin(req)
    const { id } = SnapParams.parse(req.params)
    const { approve } = ReviewRequest.parse(req.body)
    const { userId } = await services.reviewSnap(id, approve)
    // A rejection removes that day's credit; recompute the owner's streak and the trees now.
    await services.settle({ userId })
    const body: ReviewResponse = { snapId: id, status: approve ? 'approved' : 'rejected' }
    res.json(body)
  })

  // ── Local demo helpers: never mounted outside APP_ENV=local ──
  if (opts.env === 'local') {
    /** Close today for my habits right now and recompute streaks and trees (so you can watch them react). */
    router.post('/v1/dev/end-day', auth, async (req, res) => {
      const body: SettleResponse = await services.settle({ userId: req.user!.id, throughToday: true })
      res.json(body)
    })
  }

  return router
}
