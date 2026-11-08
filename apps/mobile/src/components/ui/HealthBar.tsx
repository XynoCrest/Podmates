import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

/** Rounded progress bar; colour shifts with health so a dying tree reads at a glance. */
export function HealthBar({ ratio, height = 14, color }: { ratio: number; height?: number; color?: string }) {
  const fill = color ?? (ratio > 0.5 ? colors.leaf.DEFAULT : ratio > 0.25 ? colors.energy.DEFAULT : colors.danger.DEFAULT)
  const clamped = Math.min(1, Math.max(0, ratio))
  // A full-width fill slid left, so the change animates on transform (not width) and keeps its round end.
  const [w, setW] = useState(0)
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height, borderRadius: height / 2, backgroundColor: colors.raised, overflow: 'hidden' }}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fill,
          opacity: w ? 1 : 0,
          transform: [{ translateX: -(1 - clamped) * w }],
          transitionProperty: 'transform',
          transitionDuration: 400,
          transitionTimingFunction: 'ease-out',
        }}
      />
    </View>
  )
}
