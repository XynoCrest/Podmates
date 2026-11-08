import { describe, expect, it, vi } from 'vitest'
import { silentLogger } from '../lib/logger'
import type { Services } from '../services/types'
import { startWorker } from './loop'

describe('worker', () => {
  it('still settles pairs when pod settlement fails, and asks settlement to skip failing pods', async () => {
    const settle = vi.fn(async () => {
      throw new Error('boom')
    })
    const settlePairs = vi.fn(async () => 0)
    const services = { settle, settlePairs } as unknown as Services
    const worker = startWorker({ services, log: silentLogger, pollMs: 60_000 })
    await vi.waitFor(() => expect(settlePairs).toHaveBeenCalled())
    worker.stop()
    expect(settle).toHaveBeenCalledWith(expect.objectContaining({ onError: expect.any(Function) }))
    expect(settlePairs).toHaveBeenCalledWith(expect.objectContaining({ onError: expect.any(Function) }))
  })
})
