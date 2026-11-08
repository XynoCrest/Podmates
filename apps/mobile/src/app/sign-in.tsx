import { colors } from '@podmates/ui-tokens'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, PressableScale, Text } from '@/components/ui'
import { auth } from '@/ctx/session'
import { TreeArt } from '@/features/tree/TreeArt'
import { isLocal } from '@/lib/env'
import { haptics } from '@/lib/haptics'

const DEMO = [
  { email: 'ben@podmates.dev', name: 'Ben S.', color: 'leaf' },
  { email: 'maya@podmates.dev', name: 'Maya', color: 'rose' },
  { email: 'theo@podmates.dev', name: 'Theo', color: 'flame' },
  { email: 'priya@podmates.dev', name: 'Priya', color: 'sky' },
  { email: 'jonas@podmates.dev', name: 'Jonas', color: 'star' },
  { email: 'aisha@podmates.dev', name: 'Aisha', color: 'teal' },
]

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
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8 }}>
          <TreeArt growth={6} health={1} size={150} />
          <Text variant="display">Podmates</Text>
          <Text variant="subhead" center>
            Build habits with your people. Snap the proof, grow a tree together.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {mode === 'signUp' ? (
            <>
              <Field value={name} onChangeText={setName} placeholder="Name" autoCapitalize="words" />
              <Field value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" />
            </>
          ) : null}
          <Field value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoComplete="password" />
          {error ? (
            <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
              {error}
            </Text>
          ) : null}
          <Button label={mode === 'signIn' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy === 'form'} size="lg" />
          <Button
            variant="ghost"
            label={mode === 'signIn' ? 'New here? Create an account' : 'Have an account? Sign in'}
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          />
        </View>

        {isLocal ? (
          <View style={{ gap: 12 }}>
            <Text variant="overline">Demo accounts · local only</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {DEMO.map((d) => (
                <PressableScale key={d.email} onPress={() => run(d.email, () => auth.signIn(d.email, 'podmates123'))} accessibilityLabel={`Sign in as ${d.name}`}>
                  <View style={{ alignItems: 'center', gap: 6, width: 64, opacity: busy && busy !== d.email ? 0.4 : 1 }}>
                    <Avatar person={{ display_name: d.name, avatar_color: d.color }} size={52} ring={busy === d.email ? 'unseen' : undefined} />
                    <Text variant="caption">{d.name}</Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.ink.subtle}
      {...props}
      style={{ height: 48, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, color: colors.ink.DEFAULT, fontSize: 16 }}
    />
  )
}
