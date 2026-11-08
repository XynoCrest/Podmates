import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import { initials } from '@/lib/format'
import { imageUri } from '@/lib/images'

export interface AvatarPerson {
  display_name: string
  avatar_color: string
  avatar_url?: string | null
}

/**
 * Round avatar: photo if set, else initials on the person's colour.
 * `ring`: 'unseen' = solid flame (new snaps), 'seen' = quiet grey, undefined = none.
 */
export function Avatar({ person, size = 40, ring: ringState }: { person: AvatarPerson; size?: number; ring?: 'unseen' | 'seen' }) {
  const bg = avatarColors[person.avatar_color as keyof typeof avatarColors] ?? avatarColors.leaf
  const face = (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {person.avatar_url ? (
        <Image source={{ uri: imageUri(person.avatar_url) }} style={{ width: size, height: size }} contentFit="cover" transition={150} />
      ) : (
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '600' }}>{initials(person.display_name)}</Text>
      )}
    </View>
  )
  if (!ringState) return face

  const gap = Math.max(2, size * 0.05)
  const stroke = Math.max(2, size * 0.045)
  const outer = size + (gap + stroke) * 2
  const inner = (
    <View style={{ padding: gap, borderRadius: outer / 2, backgroundColor: colors.canvas }}>{face}</View>
  )
  return <View style={{ padding: stroke, borderRadius: outer / 2, backgroundColor: ringState === 'unseen' ? colors.flame.DEFAULT : colors.line }}>{inner}</View>
}
