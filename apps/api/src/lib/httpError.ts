import type { ApiErrorCode } from '@podmates/shared'

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  validation: 400,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  service_unavailable: 503,
  internal: 500,
}

/** Throw from any handler; the error middleware turns it into { error, code }. */
export class HttpError extends Error {
  readonly status: number
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message)
    this.status = STATUS[code]
  }
}
