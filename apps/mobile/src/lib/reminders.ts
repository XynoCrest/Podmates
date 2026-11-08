/**
 * Clearing scheduled reminders, in its own module so the session code can use it without
 * importing the pod hooks (which import the session).
 */
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

/** Removes every scheduled snap reminder (on sign-out, account deletion, or a different person signing in). */
export async function cancelReminders() {
  if (Platform.OS === 'web') return
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch {
    // Nothing scheduled or no permission: nothing to clear.
  }
}
