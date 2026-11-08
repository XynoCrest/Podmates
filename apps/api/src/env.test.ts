import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { EnvSchema } from './env'

describe('env contract', () => {
  it('every env key is documented in .env.example', () => {
    const example = readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
    const documented = new Set([...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]))
    const missing = Object.keys(EnvSchema.shape).filter((k) => !documented.has(k))
    expect(missing).toEqual([])
  })

  it('has no default for Supabase credentials (no silent fallbacks)', () => {
    const r = EnvSchema.safeParse({ APP_ENV: 'local' })
    expect(r.success).toBe(false)
  })
})
