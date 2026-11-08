/**
 * Hands the just-captured photo from the camera to the "Send to" sheet in memory.
 *
 * Don't pass file URIs through route params: Expo Go on Android stores files under a
 * directory literally named `%40anonymous%2F<slug>…`, and the router decodes params once,
 * so the sheet would receive a path that doesn't exist ("Loading bitmap failed").
 */
let pending: string | null = null

export function setPendingCapture(uri: string) {
  pending = uri
}

export function takePendingCapture(): string | null {
  return pending
}
