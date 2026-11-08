import { useState } from 'react'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

/** The long, settled ease-out used for a change of selection. */
const EASE = cubicBezier(0.32, 0.72, 0, 1)

/** Remembers where each option sits, so an indicator can slide to the selected one. */
export function useOptionLayouts<K extends string>() {
  const [layouts, setLayouts] = useState<Partial<Record<K, { x: number; w: number }>>>({})
  const onLayoutFor = (key: K) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout
    setLayouts((prev) => (prev[key]?.x === x && prev[key]?.w === width ? prev : { ...prev, [key]: { x, w: width } }))
  }
  return { layouts, onLayoutFor }
}

/**
 * An absolutely placed shape that slides and resizes to `at` (x and width in its parent).
 * Hidden until the first measurement, so it never animates in from the corner.
 */
export function SlideIndicator({ at, inset = 0, style }: { at: { x: number; w: number } | undefined; inset?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0 },
        style,
        {
          opacity: at ? 1 : 0,
          width: at ? at.w - inset * 2 : 0,
          transform: [{ translateX: at ? at.x + inset : 0 }],
          transitionProperty: ['transform', 'width'],
          transitionDuration: 320,
          transitionTimingFunction: EASE,
        },
      ]}
    />
  )
}
