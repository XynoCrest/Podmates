import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../lib/httpError'
import type { AuthUser, Services } from '../services/types'

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser
  }
}

/** Requires a valid Supabase access token. Identity comes from the verified JWT only. */
export function requireUser(services: Services) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.get('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token) return next(new HttpError('unauthorized', 'Missing bearer token'))
    const user = await services.verifyAccessToken(token)
    if (!user) return next(new HttpError('unauthorized', 'Invalid or expired token'))
    req.user = user
    next()
  }
}
