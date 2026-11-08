import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, Switch, TextInput, View } from 'react-native'
import { Avatar, Button, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useProfile, useUpdateProfile, type Profile } from '@/features/profile/hooks'
import { haptics } from '@/lib/haptics'

export default function EditProfile() {
  const profile = useProfile(useMe())
  return profile.data ? <EditForm profile={profile.data} /> : null
}

function EditForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [form, setForm] = useState({ display_name: profile.display_name, username: profile.username, bio: profile.bio, avatar_color: profile.avatar_color, is_private: profile.is_private })
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
      <Text variant="title">Edit profile</Text>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Avatar person={{ ...form, avatar_url: photo ?? profile.avatar_url }} size={96} />
        <Button label="Change photo" variant="ghost" size="sm" onPress={pickPhoto} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {Object.entries(avatarColors).map(([key, hex]) => (
            <PressableScale key={key} onPress={() => setForm({ ...form, avatar_color: key })} accessibilityLabel={`Colour ${key}`} scaleTo={0.9}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: hex, borderWidth: 3, borderColor: form.avatar_color === key ? colors.ink.DEFAULT : 'transparent' }} />
            </PressableScale>
          ))}
        </View>
      </View>
      <Labeled label="Name" value={form.display_name} onChangeText={(v) => setForm({ ...form, display_name: v })} />
      <Labeled label="Username" value={form.username} autoCapitalize="none" onChangeText={(v) => setForm({ ...form, username: v })} />
      <Labeled label="Bio" value={form.bio} multiline maxLength={160} onChangeText={(v) => setForm({ ...form, bio: v })} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, backgroundColor: colors.raised, padding: 14 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Private profile</Text>
          <Text variant="caption">Only followers you approve see your profile grid. Your snaps still count in your pods.</Text>
        </View>
        <Switch value={form.is_private} onValueChange={(v) => setForm({ ...form, is_private: v })} accessibilityLabel="Private profile" />
      </View>
      {update.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {update.error.message}
        </Text>
      ) : null}
      <Button label="Save" size="lg" onPress={save} loading={update.isPending} />
    </ScrollView>
  )
}

function Labeled({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="overline">{label}</Text>
      <TextInput
        placeholderTextColor={colors.ink.subtle}
        {...props}
        style={{ minHeight: 46, borderRadius: 12, backgroundColor: colors.raised, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink.DEFAULT, fontSize: 16 }}
      />
    </View>
  )
}
