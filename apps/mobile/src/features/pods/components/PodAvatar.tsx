import { healthRatio } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { TreeArt } from '@/features/tree/TreeArt'

/**
 * Pod icon: the pod's tree on a tinted disc. Green tint = healthy,
 * amber = wilting (half health or less), grey = dead (resting tree).
 */
export function PodAvatar({ growth, hp, maxHp, dead, size = 64 }: { growth: number; hp: number; maxHp: number; dead?: boolean; size?: number }) {
  const ratio = dead ? 0 : healthRatio({ hp, maxHp })
  const bg = dead ? colors.raised : ratio > 0.5 ? colors.leaf.soft : colors.flame.soft
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <TreeArt growth={growth} dead={dead} size={size * 0.8} still />
    </View>
  )
}
