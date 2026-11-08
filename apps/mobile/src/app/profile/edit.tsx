import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Avatar, Button, PressableScale, Text, TextField } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useProfile, useUpdateProfile, type Profile } from '@/features/profile/hooks'
import { haptics } from '@/lib/haptics'

export default function EditProfile() {
  const profile = useProfile(useMe())
  return profile.data ? <EditForm profile={profile.data} /> : null
}

function EditForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [form, setForm] = useState({ display_name: profile.display_name, username: profile.username, bio: profile.bio, avatar_color: profile.avatar_color })
  const [photo, setPhoto] = useState<string | null>(null)

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 })
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri)
  }

  const save = () =>
    update.mutate(
      { ...form, newAvatarUri: photo },
      {
        onSuccess: () => {
          haptics.success()
          router.back()
        },
        onError: () => haptics.error(),
      },
    )

  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.4 }}>Edit profile</Text>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Avatar person={{ ...form, avatar_url: photo ?? profile.avatar_url }} size={104} ring="unseen" />
        <Button label="Change photo" variant="ghost" size="sm" onPress={pickPhoto} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {Object.entries(avatarColors).map(([key, hex]) => (
            <PressableScale key={key} onPress={() => setForm({ ...form, avatar_color: key })} accessibilityLabel={`Colour ${key}`} scaleTo={0.9}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: hex, borderWidth: 3, borderColor: form.avatar_color === key ? colors.ink.DEFAULT : colors.surface }} />
            </PressableScale>
          ))}
        </View>
      </View>
      <TextField label="Name" value={form.display_name} onChangeText={(v) => setForm({ ...form, display_name: v })} />
      <TextField label="Username" value={form.username} autoCapitalize="none" onChangeText={(v) => setForm({ ...form, username: v })} />
      <TextField label="Bio" value={form.bio} multiline maxLength={160} style={{ minHeight: 96 }} onChangeText={(v) => setForm({ ...form, bio: v })} />
      {update.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {update.error.message}
        </Text>
      ) : null}
      <Button label="Save" size="lg" onPress={save} loading={update.isPending} />
    </ScrollView>
  )
}
