import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { Avatar } from '@/components/ui'
import type { Person } from '../hooks'

/**
 * Group icon: two members' faces, one tucked behind the other (top-left / bottom-right).
 * Shows my podmates first; a pod with only one face shows that face full size.
 */
export function PodAvatar({ members, me, size = 54 }: { members: Person[]; me?: string | null; size?: number }) {
  const others = members.filter((m) => m.id !== me)
  const faces = (others.length ? [...others, ...members.filter((m) => m.id === me)] : members).slice(0, 2)
  if (faces.length < 2) {
    const only = faces[0]
    return only ? <Avatar person={only} size={size} /> : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.raised }} />
  }
  const face = Math.round(size * 0.68)
  const border = 3
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        <Avatar person={faces[1]!} size={face} />
      </View>
      <View style={{ position: 'absolute', right: -border, bottom: -border, padding: border, borderRadius: face, backgroundColor: colors.canvas }}>
        <Avatar person={faces[0]!} size={face} />
      </View>
    </View>
  )
}
