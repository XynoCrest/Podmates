/**
 * The single chokepoint for calls to apps/api. Most data does NOT come through
 * here — the app reads and writes Supabase directly under RLS. The API is only
 * for work that needs server privileges (tree replanting, local demo helpers).
 */
import { OpenWindowResponse, ReplantResponse, SettleResponse, type ApiErrorCode } from '@podmates/shared'
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
  async replant(podId: string) {
    return ReplantResponse.parse(await request('POST', `/v1/pods/${podId}/replant`, {}))
  },
  /** Local only: close today now and settle it. */
  async endDay(podId: string) {
    return SettleResponse.parse(await request('POST', `/v1/dev/pods/${podId}/end-day`, {}))
  },
  /** Local only: move the snap window so it is open now. */
  async openWindow(podId: string) {
    return OpenWindowResponse.parse(await request('POST', `/v1/dev/pods/${podId}/open-window`, {}))
  },
}
