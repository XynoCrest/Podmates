/**
 * Request/response schemas for apps/api. The app parses every API response with
 * these; the API types its handlers with them. Most data does NOT go through the
 * API (the app reads Supabase directly under RLS) — see docs/ARCHITECTURE.md.
 */
import { z } from 'zod'

export const HealthResponse = z.object({
  ok: z.literal(true),
  service: z.literal('podmates-api'),
  env: z.string(),
  worker: z.boolean(),
})
export type HealthResponse = z.infer<typeof HealthResponse>

export const DayOutcome = z.enum(['thrive', 'steady', 'wilt', 'dormant'])

export const SettledDay = z.object({
  podId: z.uuid(),
  podDate: z.iso.date(),
  outcome: DayOutcome,
  contributors: z.number().int(),
  members: z.number().int(),
  hpDelta: z.number().int(),
  hpAfter: z.number().int(),
  died: z.boolean(),
})
export type SettledDay = z.infer<typeof SettledDay>

export const SettleResponse = z.object({ settled: z.array(SettledDay) })
export type SettleResponse = z.infer<typeof SettleResponse>

export const ReplantResponse = z.object({ podId: z.uuid(), hp: z.number().int(), maxHp: z.number().int() })
export type ReplantResponse = z.infer<typeof ReplantResponse>

/** Local-only demo helper: moves the pod's snap window so it is open right now. */
export const OpenWindowResponse = z.object({ podId: z.uuid(), snapTime: z.string() })
export type OpenWindowResponse = z.infer<typeof OpenWindowResponse>
