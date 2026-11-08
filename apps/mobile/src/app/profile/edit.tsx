import { avatar as avatarColors, colors, radii, space } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Avatar, Button, PressableScale, ScreenState, Section, SheetScreen, TextField } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useProfile, useUpdateProfile, type Profile } from '@/features/profile/hooks'
import { haptics } from '@/lib/haptics'
import { imageUri } from '@/lib/images'

export default function EditProfile() {
  const profile = useProfile(useMe())
  return profile.data ? <EditForm profile={profile.data} /> : <ScreenState fill loading={profile.isLoading} error={profile.error} onRetry={() => void profile.refetch()} />
}

function EditForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [form, setForm] = useState({ display_name: profile.display_name, username: profile.username, avatar_color: profile.avatar_color })
  const [photo, setPhoto] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 })
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri)
  }

  async function pickBanner() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 1], quality: 0.9 })
    if (!r.canceled && r.assets[0]) setBanner(r.assets[0].uri)
  }

  const save = () =>
    update.mutate(
      { ...form, newAvatarUri: photo, newBannerUri: banner },
      {
        onSuccess: () => {
          haptics.success()
          router.back()
        },
        onError: () => haptics.error(),
      },
    )

  return (
    <SheetScreen title="Edit profile" error={update.error?.message} action={<Button label="Save" size="lg" onPress={save} loading={update.isPending} />}>
      <Section label="Banner">
        <View style={{ height: 96, borderRadius: radii.card, overflow: 'hidden', backgroundColor: avatarColors[form.avatar_color as keyof typeof avatarColors] ?? colors.raised }}>
          {banner ?? profile.banner_url ? <Image source={{ uri: banner ?? imageUri(profile.banner_url!) }} style={{ width: '100%', height: 96 }} contentFit="cover" /> : null}
        </View>
        <Button label={profile.banner_url || banner ? 'Change banner' : 'Add a banner'} variant="ghost" size="sm" onPress={pickBanner} />
      </Section>
      <View style={{ alignItems: 'center', gap: space.md }}>
        <Avatar person={{ ...form, avatar_url: photo ?? profile.avatar_url }} size={96} />
        <Button label="Change photo" variant="ghost" size="sm" onPress={pickPhoto} />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {Object.entries(avatarColors).map(([key, hex]) => (
            <PressableScale key={key} onPress={() => setForm({ ...form, avatar_color: key })} accessibilityLabel={`Colour ${key}`} scaleTo={0.9}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: hex, borderWidth: 3, borderColor: form.avatar_color === key ? colors.ink.DEFAULT : 'transparent' }} />
            </PressableScale>
          ))}
        </View>
      </View>
      <TextField label="Name" value={form.display_name} onChangeText={(v) => setForm({ ...form, display_name: v })} />
      <TextField label="Username" value={form.username} autoCapitalize="none" onChangeText={(v) => setForm({ ...form, username: v })} />
    </SheetScreen>
  )
}
