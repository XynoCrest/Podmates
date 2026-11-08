import type { FlaggedSnap, SettleResponse } from '@podmates/shared'

export interface AuthUser {
  id: string
  email: string | null
}

export interface SettleOptions {
  /** Only this user's habits (default: everyone). */
  userId?: string
  /** Also close today (local demo "end the day now"). Default: only days that have ended. */
  throughToday?: boolean
  now?: Date
}

/** Everything routes need from the outside world — faked in app.test.ts. */
export interface Services {
  verifyAccessToken(token: string): Promise<AuthUser | null>
  isAdmin(userId: string): Promise<boolean>
  settle(options?: SettleOptions): Promise<SettleResponse>
  flaggedSnaps(): Promise<FlaggedSnap[]>
  /** Returns the snap's owner so their streak can be recomputed. */
  reviewSnap(snapId: string, approve: boolean): Promise<{ userId: string }>
}
