import { Router } from 'express'
import { requireUser } from '../middleware/auth'
import type { Services } from '../services/types'

/** The signed-in user's own account. */
export function accountRouter(services: Services) {
  const router = Router()
  const auth = requireUser(services)

  /** Delete my account, photos and data for good (App Store rule: deletion must be in the app). */
  router.delete('/v1/me', auth, async (req, res) => {
    await services.deleteAccount(req.user!.id)
    res.status(204).end()
  })

  return router
}
