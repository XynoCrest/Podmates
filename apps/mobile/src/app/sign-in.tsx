import { colors, intro, space } from '@podmates/ui-tokens'
import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, HERO_OVERLAP, IntroSheet, Segmented, Text, TextField } from '@/components/ui'
import { auth } from '@/ctx/session'
import { HairlineFigure } from '@/features/tree/GroveFigure'
import { ONBOARDING_FIGURES } from '@/features/tree/onboardingPaths'
import { isLocal } from '@/lib/env'
import { haptics } from '@/lib/haptics'

/** The big light title: thin system font in brand green, like a product intro. */
const TITLE = { fontSize: 52, lineHeight: 56, fontWeight: '300', letterSpacing: -1.4 } as const

export default function SignIn() {
  const insets = useSafeAreaInsets()
  // Local only: `exp://<host>:8081/--/sign-in?demo=maya` signs straight in (handy for a second simulator).
  const { demo } = useLocalSearchParams<{ demo?: string }>()
  useEffect(() => {
    if (isLocal && demo) void auth.signIn(`${demo}@podmates.dev`, 'podmates123')
  }, [demo])
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    const { error } =
      mode === 'signIn' ? await auth.signIn(email.trim(), password) : await auth.signUp(email.trim(), password, username.trim().toLowerCase(), name.trim() || username.trim())
    setBusy(false)
    if (error) {
      haptics.error()
      setError(error.message)
    } else haptics.success()
  }

  const signUp = mode === 'signUp'
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: intro.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        {/* The intro: the pea pod in green lines, then a thin title and a soft line under it. */}
        <View style={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.gutter, paddingBottom: HERO_OVERLAP + space.xl, gap: space.lg }}>
          <View accessible={false} style={{ alignItems: 'center' }}>
            <HairlineFigure drawing={ONBOARDING_FIGURES.peapod} height={170} ground={intro.bg} ink={intro.ink} />
          </View>
          <View style={{ gap: space.md }}>
            <Text style={[TITLE, { color: intro.ink }]} center accessibilityRole="header">
              Introducing{'\n'}Podmates
            </Text>
            <Text variant="callout" center style={{ color: colors.ink.muted }}>
              Build positive habits, stay consistent, and turn small daily actions into lifelong routines.
            </Text>
          </View>
        </View>

        <IntroSheet bottomInset={insets.bottom} grow>
          <View style={{ paddingHorizontal: space.gutter, gap: space.xl }}>
            <Segmented
              value={mode}
              onChange={(m) => {
                setError(null)
                setMode(m)
              }}
              segments={[
                { key: 'signIn', label: 'Sign in' },
                { key: 'signUp', label: 'Create account' },
              ]}
            />
            <View style={{ gap: space.lg }}>
              {signUp ? (
                <>
                  <TextField label="Name" value={name} onChangeText={setName} placeholder="Maya Lopez" autoCapitalize="words" textContentType="name" />
                  <TextField label="Username" value={username} onChangeText={setUsername} placeholder="maya.reads" autoCapitalize="none" autoCorrect={false} textContentType="username" />
                </>
              ) : null}
              <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <TextField label="Password" value={password} onChangeText={setPassword} placeholder={signUp ? 'At least 6 characters' : 'Your password'} secureTextEntry autoComplete={signUp ? 'new-password' : 'password'} />
            </View>
            <View style={{ gap: space.sm }}>
              <Button label={signUp ? 'Create account' : 'Get started'} onPress={submit} loading={busy} size="lg" />
              {error ? (
                <Text variant="caption" center style={{ color: colors.danger.DEFAULT }}>
                  {error}
                </Text>
              ) : null}
            </View>
          </View>
        </IntroSheet>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
