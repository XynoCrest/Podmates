import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { View } from 'react-native'
import { initials } from '@/lib/format'
import { imageUri } from '@/lib/images'
import { Text } from './Text'

export interface AvatarPerson {
  display_name: string
  avatar_color: string
  avatar_url?: string | null
}

/** Round avatar: photo if set, else initials on the person's muted colour. */
export function Avatar({ person, size = 40, outline }: { person: AvatarPerson; size?: number; outline?: string }) {
  const bg = avatarColors[person.avatar_color as keyof typeof avatarColors] ?? avatarColors.leaf
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: outline ? 2 : 0,
        borderColor: outline ?? colors.canvas,
      }}
    >
      {person.avatar_url ? (
        <Image source={{ uri: imageUri(person.avatar_url) }} style={{ width: size, height: size }} contentFit="cover" transition={150} />
      ) : (
        <Text style={{ color: colors.ink.DEFAULT, fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.5), fontWeight: '600' }}>{initials(person.display_name)}</Text>
      )}
    </View>
  )
}
