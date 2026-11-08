import { colors } from '@podmates/ui-tokens'
import { QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ConfigError } from '@/components/system/SetupScreens'
import { SessionProvider, useMe, useSession } from '@/ctx/session'
import { syncTimezone } from '@/features/profile/hooks'
import { deviceTimeZone } from '@/lib/format'
import { env } from '@/lib/env'
import { useSnapReminders } from '@/lib/notifications'
import { queryClient } from '@/lib/queryClient'

SplashScreen.preventAutoHideAsync().catch(() => {})

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.canvas, card: colors.canvas, primary: colors.leaf.DEFAULT } }

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        {env ? (
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <SessionGate />
            </SessionProvider>
          </QueryClientProvider>
        ) : (
          <HideSplash>
            <ConfigError />
          </HideSplash>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

const sheet = {
  presentation: 'formSheet',
  sheetGrabberVisible: true,
  sheetCornerRadius: 28,
  contentStyle: { backgroundColor: colors.surface },
} as const

function SessionGate() {
  const session = useSession()
  if (session.status === 'loading') return null // native splash stays up
  const signedIn = session.status === 'ready'
  return (
    <HideSplash>
      {signedIn ? <Reminders /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Protected guard={signedIn} redirectTo="/sign-in">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="pod/[id]/index" />
          <Stack.Screen name="dm/[userId]" />
          {/* The tree is its own little world: full screen, closes with an X like a game screen. */}
          <Stack.Screen name="pod/[id]/tree" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="story/[userId]" options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: '#000' } }} />
          <Stack.Screen name="snap/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: '#000' } }} />
          <Stack.Screen name="send" options={{ ...sheet, sheetAllowedDetents: [0.75, 1] }} />
          <Stack.Screen name="pod/new" options={{ ...sheet, sheetAllowedDetents: [0.9] }} />
          <Stack.Screen name="profile/edit" options={{ ...sheet, sheetAllowedDetents: [0.9] }} />
          <Stack.Screen name="profile/pick" options={{ ...sheet, sheetAllowedDetents: [0.9] }} />
          <Stack.Screen name="post/new" options={{ ...sheet, sheetAllowedDetents: [0.7] }} />
          <Stack.Screen name="user/[id]" />
          <Stack.Screen name="admin/flagged" />
          <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="post/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </HideSplash>
  )
}

/** Signed-in background work: reminders, and keeping my profile's timezone in step with the device. */
function Reminders() {
  const me = useMe()
  useSnapReminders()
  useEffect(() => {
    void syncTimezone(me, deviceTimeZone())
  }, [me])
  return null
}

function HideSplash({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])
  return children
}
