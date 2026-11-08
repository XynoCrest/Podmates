import type { OpenWindowResponse, ReplantResponse, SettledDay } from '@podmates/shared'

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
}

/** Everything routes need from the outside world — faked in app.test.ts. */
export interface Services {
  verifyAccessToken(token: string): Promise<AuthUser | null>
  isPodMember(podId: string, userId: string): Promise<boolean>
  settle(options?: SettleOptions): Promise<SettledDay[]>
  replant(podId: string, now?: Date): Promise<ReplantResponse>
  openWindowNow(podId: string, now?: Date): Promise<OpenWindowResponse>
}
