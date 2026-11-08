import { Platform } from 'react-native'

/**
 * expo-notifications pulls expo-application at import time. Expo Go on Android
 * often has no Application module, or its context is already closed after a
 * reload — either way, loading the package redscreens the app.
 */
export function loadNotifications(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web') return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('expo-modules-core') as typeof import('expo-modules-core')
    const application = core.requireOptionalNativeModule('ExpoApplication')
    if (!application) return null
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as typeof import('expo-notifications')
  } catch {
    return null
  }
}
