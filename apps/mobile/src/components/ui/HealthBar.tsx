import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

/** Health colour: green while the tree is healthy, sun when tired, red when wilting. */
export const healthColor = (ratio: number) => (ratio > 0.5 ? colors.leaf.DEFAULT : ratio > 0.25 ? colors.sun.DEFAULT : colors.danger.DEFAULT)

export function HealthBar({ ratio, height = 12 }: { ratio: number; height?: number }) {
  const pct = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` as const
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.raised, overflow: 'hidden' }}>
      <Animated.View
        style={{
          width: pct,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: healthColor(ratio),
          transitionProperty: 'width',
          transitionDuration: 400,
        }}
      />
    </View>
  )
}
