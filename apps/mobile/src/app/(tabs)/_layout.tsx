import { colors } from '@podmates/ui-tokens'
import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { Icon, type IconName } from '@/components/ui'
import { needsSnap, useMyPods } from '@/features/pods/hooks'
import { useNow } from '@/lib/useNow'

/**
 * Flat white tab bar from the app-screens PDF: icon only, green when active with a dot under it.
 * Camera is a tab, but it hides the bar and runs full screen with its own close button.
 * `backBehavior="history"` so that close button returns to the tab you came from.
 */
export default function TabsLayout() {
  const now = useNow()
  const pods = useMyPods()
  const due = pods.data?.filter((p) => needsSnap(p, now)).length ?? 0
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.leaf.DEFAULT,
        tabBarInactiveTintColor: colors.ink.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: 1, height: 88, paddingTop: 10 },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Pods', tabBarBadge: due > 0 ? due : undefined, tabBarBadgeStyle: { backgroundColor: colors.flame.DEFAULT }, tabBarIcon: tab('chat', 'chatFill') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: tab('explore', 'explore') }} />
      <Tabs.Screen name="camera" options={{ title: 'Snap', tabBarIcon: tab('camera', 'cameraFill'), tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tab('profile', 'profileFill') }} />
    </Tabs>
  )
}

function tab(icon: IconName, active: IconName) {
  function TabIcon({ focused }: { focused: boolean }) {
    return (
      <View style={{ alignItems: 'center', gap: 5 }}>
        <Icon name={focused ? active : icon} size={28} color={focused ? colors.leaf.DEFAULT : colors.ink.muted} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: focused ? colors.leaf.bright : 'transparent' }} />
      </View>
    )
  }
  return TabIcon
}
