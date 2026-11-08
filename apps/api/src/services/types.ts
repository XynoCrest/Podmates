import type { OpenWindowResponse, PairReplantResponse, ReplantResponse, SettledDay } from '@podmates/shared'
import type { PairSettleOptions } from './pairSettlement'

export interface AuthUser {
  id: string
  email: string | null
}

export interface SettleOptions {
  /** Only this pod (default: every pod). */
  podId?: string
  /** Also close today (local demo "end the day now"). Default: only days that have ended. */
  throughToday?: boolean
  now?: Date
  /** One pod failing (bad data, a transient error) shouldn't stop the others: report it here and carry on. Without it, the first error is thrown. */
  onError?: (podId: string, err: unknown) => void
}

/** Everything routes need from the outside world — faked in app.test.ts. */
export interface Services {
  verifyAccessToken(token: string): Promise<AuthUser | null>
  isPodMember(podId: string, userId: string): Promise<boolean>
  settle(options?: SettleOptions): Promise<SettledDay[]>
  /** Do these two share a pod? */
  arePodmates(userId: string, otherId: string): Promise<boolean>
  /** Settles podmate pair trees; returns how many pair-days were written. */
  settlePairs(options?: PairSettleOptions): Promise<number>
  replantPair(userId: string, otherId: string, now?: Date): Promise<PairReplantResponse>
  replant(podId: string, now?: Date): Promise<ReplantResponse>
  openWindowNow(podId: string, now?: Date): Promise<OpenWindowResponse>
  /** Deletes the user's photos and account for good; the database cascades the rest. */
  deleteAccount(userId: string): Promise<void>
}
