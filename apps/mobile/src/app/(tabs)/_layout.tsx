import { colors } from '@podmates/ui-tokens'
import { NativeTabs } from 'expo-router/native-tabs'
import { useMyHabits } from '@/features/pods/hooks'

/**
 * The platform's real tab bar. On iOS 26 the system draws it as the floating
 * Liquid Glass pill; icon over label, outline → filled on select, like Uber's bar.
 * Home's badge = habits not done (snapped or rested) yet today.
 */
export default function TabsLayout() {
  const habits = useMyHabits()
  const due = habits.data.filter((h) => !h.today).length
  return (
    <NativeTabs tintColor={colors.ink.DEFAULT} iconColor={{ default: colors.ink.muted, selected: colors.ink.DEFAULT }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        {due > 0 ? <NativeTabs.Trigger.Badge>{String(due)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="camera">
        <NativeTabs.Trigger.Label>Snap</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'camera', selected: 'camera.fill' }} md="photo_camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
