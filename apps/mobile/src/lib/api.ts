/**
 * The single chokepoint for calls to apps/api. Most data does NOT come through
 * here — the app reads and writes Supabase directly under RLS. The API is only
 * for work that needs server privileges (team review of flagged snaps, local demo helpers).
 */
import { FlaggedResponse, ReviewResponse, SettleResponse, type ApiErrorCode } from '@podmates/shared'
import { env } from './env'
import { supabase } from './supabase'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status: number,
  ) {
    super(message)
  }
}

const DEFAULT_TIMEOUT_MS = 15_000

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  if (!env) throw new ApiError('App is not configured', 'internal', 0)
  const { data } = await supabase.auth.getSession()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${env.EXPO_PUBLIC_API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(`Can't reach the Podmates API at ${env.EXPO_PUBLIC_API_URL} (npm run dev:api)`, 'service_unavailable', 0)
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new ApiError(json?.error ?? `Request failed (${res.status})`, json?.code ?? 'internal', res.status)
  return json as T
}

export const api = {
  /** Local only: close today for my habits now and recompute streaks and trees. */
  async endDay() {
    return SettleResponse.parse(await request('POST', '/v1/dev/end-day', {}))
  },
  /** Podmates team: snaps hidden by flags, waiting for review. */
  async flagged() {
    return FlaggedResponse.parse(await request('GET', '/v1/admin/flagged'))
  },
  async review(snapId: string, approve: boolean) {
    return ReviewResponse.parse(await request('POST', `/v1/admin/snaps/${snapId}/review`, { approve }))
  },
}
