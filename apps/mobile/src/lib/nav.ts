import { router } from 'expo-router'

/** Back, or home when there's nothing to go back to (screens opened from a notification or link). */
export function goBack() {
  if (router.canGoBack()) router.back()
  else router.replace('/')
}
