// Stable error code contract between apps/api and every client.
// Add new codes here; never branch client logic on the human message string.

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'service_unavailable'
  | 'internal'

export interface ApiErrorBody {
  error: string
  code: ApiErrorCode
}

export const apiError = (code: ApiErrorCode, message: string): ApiErrorBody => ({ error: message, code })
