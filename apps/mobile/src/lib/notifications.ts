/**
 * Snap-window reminders: one daily local notification per pod at its snap
 * time (converted from the pod's timezone to this device's). Local
 * notifications work in Expo Go — no push server needed for the reminder.
 * Tapping one opens the camera with that pod preselected.
 */
import { snapTimeIn } from '@podmates/shared'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useMyPods } from '@/features/pods/hooks'
import { deviceTimeZone } from './format'
import { loadNotifications } from './nativeNotifications'

export function useSnapReminders() {
  const pods = useMyPods()
  const signature = pods.data?.map((p) => `${p.id}@${p.snapTime}/${p.windowMinutes}`).join('|')

  useEffect(() => {
    if (Platform.OS === 'web' || !pods.data) return
    const list = pods.data
    void (async () => {
      try {
        const Notifications = loadNotifications()
        if (!Notifications) return
        Notifications.setNotificationHandler({
          handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
        })
        const { status } = await Notifications.requestPermissionsAsync()
        if (status !== 'granted') return
        await Notifications.cancelAllScheduledNotificationsAsync()
        const tz = deviceTimeZone()
        for (const p of list) {
          if (p.treeStatus === 'dead') continue
          const { hour, minute } = snapTimeIn({ snapTime: p.snapTime, windowMinutes: p.windowMinutes, timeZone: p.timeZone }, tz)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `📸 Snap time — ${p.name}`,
              body: `Your window is open for ${p.windowMinutes} minutes. Show your pod you turned up.`,
              data: { podId: p.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
          })
        }
      } catch {
        // Reminders are a nicety; never block the app on them.
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  useEffect(() => {
    if (Platform.OS === 'web') return
    const Notifications = loadNotifications()
    if (!Notifications) return
    try {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const podId = response.notification.request.content.data?.podId
        if (typeof podId === 'string') router.navigate({ pathname: '/camera', params: { podId } })
      })
      return () => {
        try {
          sub.remove()
        } catch {
          // ApplicationModule can already be closed after an Expo Go reload.
        }
      }
    } catch {
      return
    }
  }, [])
}
