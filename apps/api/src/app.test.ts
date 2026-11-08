import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app'
import { silentLogger } from './lib/logger'
import type { Services } from './services/types'

const POD = 'b0000000-0000-4000-8000-000000000001'
const PODMATE = 'a0000000-0000-4000-8000-000000000002'

function fakeServices(overrides: Partial<Services> = {}): Services {
  return {
    verifyAccessToken: async (t) => (t === 'good' ? { id: 'user-1', email: null } : null),
    isPodMember: async (podId) => podId === POD,
    settle: vi.fn(async () => []),
    arePodmates: async (_me, other) => other === PODMATE,
    settlePairs: vi.fn(async () => 3),
    replantPair: async (_me, other) => ({ userId: other, hp: 100, maxHp: 100 }),
    replant: async (podId) => ({ podId, hp: 100, maxHp: 100 }),
    openWindowNow: async (podId) => ({ podId, snapTime: '12:00:00' }),
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
    expect((await request(app()).post(`/v1/pods/${POD}/replant`)).status).toBe(401)
    expect((await request(app()).post(`/v1/pods/${POD}/replant`).set('Authorization', 'Bearer nope')).status).toBe(401)
  })

  it('only members can replant', async () => {
    const other = 'b0000000-0000-4000-8000-000000000009'
    const res = await request(app()).post(`/v1/pods/${other}/replant`).set('Authorization', 'Bearer good')
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('forbidden')
  })

  it('validates the pod id', async () => {
    const res = await request(app()).post('/v1/pods/not-a-uuid/replant').set('Authorization', 'Bearer good')
    expect(res.status).toBe(400)
  })

  it('end-day settles through today for that pod', async () => {
    const services = fakeServices()
    const res = await request(app('local', services)).post(`/v1/dev/pods/${POD}/end-day`).set('Authorization', 'Bearer good')
    expect(res.status).toBe(200)
    expect(services.settle).toHaveBeenCalledWith({ podId: POD, throughToday: true })
  })

  it('only podmates can replant a pair tree', async () => {
    const stranger = 'a0000000-0000-4000-8000-000000000009'
    expect((await request(app()).post(`/v1/podmates/${stranger}/replant`).set('Authorization', 'Bearer good')).status).toBe(403)
    const res = await request(app()).post(`/v1/podmates/${PODMATE}/replant`).set('Authorization', 'Bearer good')
    expect(res.body).toEqual({ userId: PODMATE, hp: 100, maxHp: 100 })
  })

  it('pair end-day settles through today for that pair', async () => {
    const services = fakeServices()
    const res = await request(app('local', services)).post(`/v1/dev/podmates/${PODMATE}/end-day`).set('Authorization', 'Bearer good')
    expect(res.body).toEqual({ settled: 3 })
    expect(services.settlePairs).toHaveBeenCalledWith({ pair: ['user-1', PODMATE], throughToday: true })
  })

  it('dev helpers do not exist outside local', async () => {
    const res = await request(app('prod')).post(`/v1/dev/pods/${POD}/end-day`).set('Authorization', 'Bearer good')
    expect(res.status).toBe(404)
  })
})
