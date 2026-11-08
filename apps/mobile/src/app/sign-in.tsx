import { colors, intro, space } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, HERO_OVERLAP, IntroSheet, Segmented, Text, TextField } from '@/components/ui'
import { auth } from '@/ctx/session'
import { isLocal } from '@/lib/env'
import { supabase } from '@/lib/supabase'
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
  const [notice, setNotice] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    setNotice(null)
    if (mode === 'signIn') {
      const { error } = await auth.signIn(email.trim(), password)
      setBusy(false)
      if (error) return fail(error.message)
      return haptics.success()
    }
    const wanted = username.trim().toLowerCase()
    const { data, error } = await auth.signUp(email.trim(), password, wanted, name.trim() || username.trim())
    setBusy(false)
    if (error) return fail(error.message)
    haptics.success()
    // With email confirmation on, there's no session yet: say so instead of doing nothing.
    if (!data.session) return setNotice('Check your email to confirm your account, then sign in.')
    // The server picks a free username (maya → maya2) when the one asked for is taken: tell them.
    if (wanted && data.user) {
      const { data: prof } = await supabase.from('profiles').select('username').eq('id', data.user.id).single()
      if (prof && prof.username !== wanted) {
        Alert.alert('Username taken', `@${wanted} was taken, so you're @${prof.username}. You can change it in Edit profile.`)
      }
    }
  }

  function fail(message: string) {
    haptics.error()
    setError(message)
  }

  const signUp = mode === 'signUp'
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: intro.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        {/* The intro: the pea pod, then a thin title and a soft line under it. */}
        <View style={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.gutter, paddingBottom: HERO_OVERLAP + space.xl, gap: space.lg }}>
          <View accessible={false} style={{ alignItems: 'center' }}>
            <Image source={require('../../assets/images/sign-in-peas.png')} style={{ width: 260, height: 170 }} contentFit="contain" />
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
                setNotice(null)
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
              {notice ? (
                <Text variant="caption" center style={{ color: intro.ink }}>
                  {notice}
                </Text>
              ) : null}
            </View>
          </View>
        </IntroSheet>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
