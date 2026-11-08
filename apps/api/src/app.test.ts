import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app'
import { silentLogger } from './lib/logger'
import type { Services } from './services/types'

const SNAP = 'e0000000-0000-4000-8000-000000000001'
const ADMIN = 'admin-1'

function fakeServices(overrides: Partial<Services> = {}): Services {
  return {
    verifyAccessToken: async (t) => (t === 'good' ? { id: 'user-1', email: null } : t === 'admin' ? { id: ADMIN, email: null } : null),
    isAdmin: async (id) => id === ADMIN,
    settle: vi.fn(async () => ({ streaks: 0, trees: 0 })),
    flaggedSnaps: async () => [],
    reviewSnap: vi.fn(async () => ({ userId: 'owner-1' })),
    ...overrides,
  }
}

const app = (env = 'local', services = fakeServices()) =>
  createApp({ services, log: silentLogger, env, worker: false, corsOrigins: [] })

describe('api', () => {
  it('health is public', async () => {
    const res = await request(app()).get('/health')
    expect(res.body).toEqual({ ok: true, service: 'podmates-api', env: 'local', worker: false })
  })

  it('rejects missing and bad tokens', async () => {
    expect((await request(app()).get('/v1/admin/flagged')).status).toBe(401)
    expect((await request(app()).get('/v1/admin/flagged').set('Authorization', 'Bearer nope')).status).toBe(401)
  })

  it('only admins can list or review flagged snaps', async () => {
    expect((await request(app()).get('/v1/admin/flagged').set('Authorization', 'Bearer good')).status).toBe(403)
    const res = await request(app()).post(`/v1/admin/snaps/${SNAP}/review`).set('Authorization', 'Bearer good').send({ approve: false })
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('forbidden')
  })

  it('a rejection reviews the snap and re-settles its owner', async () => {
    const services = fakeServices()
    const res = await request(app('prod', services)).post(`/v1/admin/snaps/${SNAP}/review`).set('Authorization', 'Bearer admin').send({ approve: false })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ snapId: SNAP, status: 'rejected' })
    expect(services.reviewSnap).toHaveBeenCalledWith(SNAP, false)
    expect(services.settle).toHaveBeenCalledWith({ userId: 'owner-1' })
  })

  it('validates the snap id and body', async () => {
    expect((await request(app()).post('/v1/admin/snaps/not-a-uuid/review').set('Authorization', 'Bearer admin').send({ approve: true })).status).toBe(400)
    expect((await request(app()).post(`/v1/admin/snaps/${SNAP}/review`).set('Authorization', 'Bearer admin').send({ approve: 'yes' })).status).toBe(400)
  })

  it('end-day settles my habits through today', async () => {
    const services = fakeServices()
    const res = await request(app('local', services)).post('/v1/dev/end-day').set('Authorization', 'Bearer good')
    expect(res.status).toBe(200)
    expect(services.settle).toHaveBeenCalledWith({ userId: 'user-1', throughToday: true })
  })

  it('dev helpers do not exist outside local', async () => {
    const res = await request(app('prod')).post('/v1/dev/end-day').set('Authorization', 'Bearer good')
    expect(res.status).toBe(404)
  })
})
