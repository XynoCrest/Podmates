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

/** One settlement pass: how many streaks and trees were (re)computed. */
export const SettleResponse = z.object({ streaks: z.number().int(), trees: z.number().int() })
export type SettleResponse = z.infer<typeof SettleResponse>

/** Team review of a snap hidden by flags. */
export const ReviewRequest = z.object({ approve: z.boolean() })
export type ReviewRequest = z.infer<typeof ReviewRequest>

export const ReviewResponse = z.object({ snapId: z.uuid(), status: z.enum(['approved', 'rejected']) })
export type ReviewResponse = z.infer<typeof ReviewResponse>

export const FlaggedSnap = z.object({
  id: z.uuid(),
  podId: z.uuid(),
  habitId: z.string(),
  userId: z.uuid(),
  image: z.string(),
  caption: z.string(),
  day: z.iso.date(),
  flagCount: z.number().int(),
})
export type FlaggedSnap = z.infer<typeof FlaggedSnap>

export const FlaggedResponse = z.object({ snaps: z.array(FlaggedSnap) })
export type FlaggedResponse = z.infer<typeof FlaggedResponse>
