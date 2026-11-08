/**
 * Clearing scheduled reminders, in its own module so the session code can use it without
 * importing the pod hooks (which import the session).
 */
import { loadNotifications } from './nativeNotifications'

/** Removes every scheduled snap reminder (on sign-out, account deletion, or a different person signing in). */
export async function cancelReminders() {
  const Notifications = loadNotifications()
  if (!Notifications) return
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch {
    // Nothing scheduled, no permission, or Expo Go tore down ApplicationModule.
  }
}
