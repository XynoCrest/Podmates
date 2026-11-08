import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { apiError } from '@podmates/shared'
import type { Logger } from './lib/logger'
import { errorHandler, notFound } from './middleware/errors'
import { healthRouter } from './routes/health'
import { v1Router } from './routes/v1'
import type { Services } from './services/types'

export interface AppOptions {
  services: Services
  log: Logger
  env: string
  worker: boolean
  corsOrigins: string[]
}

/** Express app factory — no listening, no globals, so tests can mount it with supertest. */
export function createApp({ services, log, env, worker, corsOrigins }: AppOptions) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(cors({ origin: corsOrigins }))
  app.use(express.json({ limit: '100kb' }))

  app.use(healthRouter({ env, worker }))
  app.use(
    '/v1',
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json(apiError('rate_limited', 'Too many requests, slow down'))
      },
    }),
  )
  app.use(v1Router(services, { env }))

  app.use(notFound)
  app.use(errorHandler(log))
  return app
}
