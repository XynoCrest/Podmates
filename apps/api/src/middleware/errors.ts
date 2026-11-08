import { apiError } from '@podmates/shared'
import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../lib/httpError'
import type { Logger } from '../lib/logger'

export function notFound(_req: Request, res: Response) {
  res.status(404).json(apiError('not_found', 'Route not found'))
}

export function errorHandler(log: Logger) {
  // Express recognises error middleware by its 4-argument signature.
  return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json(apiError(err.code, err.message))
      return
    }
    if (err instanceof ZodError) {
      res.status(400).json(apiError('validation', err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')))
      return
    }
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json(apiError('validation', 'Malformed JSON body'))
      return
    }
    log.error('unhandled error', { path: req.path, err: err instanceof Error ? err.message : String(err) })
    res.status(500).json(apiError('internal', 'Something went wrong'))
  }
}
