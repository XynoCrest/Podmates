import { colors } from '@podmates/ui-tokens'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, PressableScale, SectionLabel, Text, TextField } from '@/components/ui'
import { auth } from '@/ctx/session'
import { TreeArt } from '@/features/tree/TreeArt'
import { isLocal } from '@/lib/env'
import { haptics } from '@/lib/haptics'

const DEMO = ['ben', 'maya', 'theo', 'priya', 'jonas', 'aisha'].map((name) => ({ name, email: `${name}@podmates.dev` }))

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
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(key: string, fn: () => Promise<{ error: { message: string } | null }>) {
    setBusy(key)
    setError(null)
    const { error } = await fn()
    setBusy(null)
    if (error) {
      haptics.error()
      setError(error.message)
    } else haptics.success()
  }

  const submit = () =>
    run('form', () =>
      mode === 'signIn' ? auth.signIn(email.trim(), password) : auth.signUp(email.trim(), password, username.trim().toLowerCase(), name.trim() || username.trim()),
    )

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, gap: 28 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 10 }}>
          <TreeArt growth={6} size={120} still />
          <Text style={{ fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -1.2 }}>Podmates</Text>
          <Text center style={{ fontSize: 18, lineHeight: 26, color: colors.ink.muted, maxWidth: 320 }}>
            One habit. One pod. A photo inside the window, or it does not count.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          {mode === 'signUp' ? (
            <>
              <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
              <TextField label="Username" value={username} onChangeText={setUsername} placeholder="yourname" autoCapitalize="none" />
            </>
          ) : null}
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@podmates.dev" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry autoComplete="password" />
          {error ? (
            <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
              {error}
            </Text>
          ) : null}
          <View style={{ marginTop: 4 }}>
            <Button label={mode === 'signIn' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy === 'form'} size="lg" />
          </View>
          <Button
            variant="ghost"
            label={mode === 'signIn' ? 'New here? Create an account' : 'Have an account? Sign in'}
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          />
        </View>

        {isLocal ? (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
              <SectionLabel>Demo accounts</SectionLabel>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {DEMO.map((d) => {
                const active = busy === d.email
                return (
                  <PressableScale key={d.email} onPress={() => run(d.email, () => auth.signIn(d.email, 'podmates123'))} accessibilityLabel={`Sign in as ${d.name}`}>
                    <View style={{ height: 52, paddingHorizontal: 24, borderRadius: 26, justifyContent: 'center', backgroundColor: active ? colors.leaf.soft : colors.raised, opacity: busy && !active ? 0.5 : 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: active ? colors.leaf.DEFAULT : colors.ink.DEFAULT }}>{d.name}</Text>
                    </View>
                  </PressableScale>
                )
              })}
            </View>
            <Text style={{ fontSize: 15, color: colors.ink.muted }}>Local environment only. One tap signs you in as that account.</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
