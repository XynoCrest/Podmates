/**
 * Reminders, as local notifications (they work in Expo Go — no push server needed):
 *   - per habit: a daily reminder at the time you chose (optional; off by default)
 *   - an evening nudge at 8pm when a habit isn't done yet ("still time today")
 * The nudge is scheduled one-off for the next 7 evenings and recomputed whenever the app
 * opens or a habit changes, so today's is skipped once everything is done.
 * Tapping a reminder opens the camera for that habit.
 */
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useMyHabits } from '@/features/pods/hooks'

const NUDGE_HOUR = 20

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  })
}

export function useSnapReminders() {
  const habits = useMyHabits()
  const signature = habits.data.map((h) => `${h.pod.id}@${h.reminderTime ?? '-'}/${h.today ?? '-'}`).join('|')

  useEffect(() => {
    if (Platform.OS === 'web' || habits.isLoading) return
    const list = habits.data
    void (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync()
        if (status !== 'granted') return
        await Notifications.cancelAllScheduledNotificationsAsync()

        for (const h of list) {
          if (!h.reminderTime) continue
          const [hour, minute] = h.reminderTime.split(':').map(Number) as [number, number]
          await Notifications.scheduleNotificationAsync({
            content: { title: `Time for ${h.habit.name.toLowerCase()}`, body: 'Snap it any time today to keep your streak.', data: { podId: h.pod.id } },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
          })
        }

        if (!list.length) return
        const pending = list.filter((h) => !h.today)
        const now = new Date()
        for (let d = 0; d < 7; d++) {
          const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, NUDGE_HOUR, 0, 0)
          if (at <= now) continue
          // Today: only if something is still open. Later days: we can't know yet, so a gentle general nudge.
          if (d === 0 && !pending.length) continue
          const body =
            d === 0
              ? `${pending.map((h) => h.habit.name).join(', ')} ${pending.length === 1 ? 'is' : 'are'} still open. A snap or a rest day keeps your streak.`
              : 'Still time today. A snap or a rest day keeps your streak.'
          await Notifications.scheduleNotificationAsync({
            content: { title: 'Still time today', body, data: d === 0 && pending[0] ? { podId: pending[0].pod.id } : {} },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
          })
        }
      } catch {
        // Reminders are a nicety; never block the app on them.
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, habits.isLoading])

  useEffect(() => {
    if (Platform.OS === 'web') return
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const podId = response.notification.request.content.data?.podId
      router.navigate(typeof podId === 'string' ? { pathname: '/camera', params: { podId } } : '/camera')
    })
    return () => sub.remove()
  }, [])
}
