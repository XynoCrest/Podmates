import { colors } from '@podmates/ui-tokens'
import { Tabs } from 'expo-router'
import { Icon } from '@/components/ui'

/** Web fallback for the native tab bar (browser previews only; the product is iOS). */
export default function TabsLayoutWeb() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink.DEFAULT,
        tabBarInactiveTintColor: colors.ink.subtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Pods', tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <Icon name="explore" color={color} /> }} />
      <Tabs.Screen name="camera" options={{ title: 'Snap', tabBarIcon: ({ color }) => <Icon name="camera" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="profile" color={color} /> }} />
    </Tabs>
  )
}
