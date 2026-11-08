import { colors } from '@podmates/ui-tokens'
import { NativeTabs } from 'expo-router/native-tabs'
import { useMyPods, needsSnap } from '@/features/pods/hooks'
import { useNow } from '@/lib/useNow'

/**
 * The platform's real tab bar. On iOS 26 the system draws it as the floating
 * Liquid Glass pill; icon over label, outline → filled on select, like Uber's bar.
 */
export default function TabsLayout() {
  const now = useNow()
  const pods = useMyPods()
  const due = pods.data?.filter((p) => needsSnap(p, now)).length ?? 0
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
