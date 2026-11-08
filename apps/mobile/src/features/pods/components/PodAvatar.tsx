import { healthRatio } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

/** Pod icon: the habit's emoji inside a ring that IS the tree's health bar. */
export function PodAvatar({ emoji, hp, maxHp, dead, size = 54 }: { emoji: string; hp: number; maxHp: number; dead?: boolean; size?: number }) {
  const ratio = dead ? 0 : healthRatio({ hp, maxHp })
  const stroke = 3
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const color = ratio > 0.5 ? colors.leaf.DEFAULT : ratio > 0.25 ? colors.energy.DEFAULT : colors.danger.DEFAULT
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.raised} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
        />
      </Svg>
      <View style={{ width: size - 12, height: size - 12, borderRadius: size, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.4, opacity: dead ? 0.4 : 1 }}>{dead ? '🥀' : emoji}</Text>
      </View>
    </View>
  )
}
