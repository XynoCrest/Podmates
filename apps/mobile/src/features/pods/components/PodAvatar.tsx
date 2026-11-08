import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { SymbolIcon } from '@/components/ui'

/** Pod icon: the habit's symbol inside a ring that IS the pod tree's health (share of members on a streak). */
export function PodAvatar({ symbol, health, size = 54 }: { symbol: string; health: number; size?: number }) {
  const ratio = Math.min(1, Math.max(0, health))
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
        <SymbolIcon name={symbol} size={Math.round(size * 0.4)} color={colors.ink.muted} />
      </View>
    </View>
  )
}
