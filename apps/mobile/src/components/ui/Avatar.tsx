import { avatar as avatarColors, avatarSoft, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import { initials } from '@/lib/format'
import { imageUri } from '@/lib/images'
import { LineIcon } from './Icon'

export interface AvatarPerson {
  display_name: string
  avatar_color: string
  avatar_url?: string | null
}

/**
 * Round avatar: photo if set, else the first initial on the person's soft tint.
 * `ring`:
 *   'unseen'  → green ring (new snaps to watch)
 *   'seen'    → quiet grey ring
 *   'done'    → green ring + check badge (snapped today)
 *   'pending' → dashed grey outline, greyed initial (not snapped yet)
 */
export function Avatar({ person, size = 40, ring }: { person: AvatarPerson; size?: number; ring?: 'unseen' | 'seen' | 'done' | 'pending' }) {
  const key = person.avatar_color as keyof typeof avatarColors
  const pending = ring === 'pending'
  const fg = pending ? colors.ink.muted : (avatarColors[key] ?? avatarColors.leaf)
  const bg = pending ? colors.surface : (avatarSoft[key] ?? avatarSoft.leaf)
  const stroke = ring ? Math.max(2, Math.round(size * 0.045)) : 0
  const borderColor = ring === 'unseen' || ring === 'done' ? colors.leaf.bright : ring === 'seen' ? colors.line : pending ? colors.ink.subtle : 'transparent'

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: stroke,
          borderColor,
          borderStyle: pending ? 'dashed' : 'solid',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {person.avatar_url ? (
          <Image source={{ uri: imageUri(person.avatar_url) }} style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: size / 2 }} contentFit="cover" transition={150} />
        ) : (
          <Text style={{ color: fg, fontSize: size * 0.4, fontWeight: '700' }}>{initials(person.display_name)[0] ?? '?'}</Text>
        )}
      </View>
      {ring === 'done' ? (
        <View style={{ position: 'absolute', right: -2, bottom: -2, borderRadius: size, backgroundColor: colors.surface, padding: 1.5 }}>
          <LineIcon name="checkedBadge" size={Math.max(14, size * 0.34)} color={colors.leaf.bright} />
        </View>
      ) : null}
    </View>
  )
}
