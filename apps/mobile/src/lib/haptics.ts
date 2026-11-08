import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// One haptic per user action, fired in the same frame as the visual change.
// Never the only feedback: haptics are off for many users and silent on web.
const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return
  fn().catch(() => {})
}

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  shutter: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  select: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
}
