import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler'
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { goBack } from '@/lib/nav'

/** Past this share of the screen, or flicked faster than FLICK pt/s, a release goes back. */
const COMMIT = 0.3
const FLICK = 600

/**
 * Swipe right to go back, for full-screen media (fullScreenModal routes have no edge swipe).
 * The page follows the finger and fades; let go past 30% of the width (or flick) and it slides
 * off and goes back, otherwise it springs home. Only a mostly-horizontal rightward drag starts
 * it, so vertical feeds and taps inside still work.
 */
export function SwipeBack({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions()
  const reduced = useReducedMotion()
  const x = useSharedValue(0)

  const pan = usePanGesture({
    activeOffsetX: 16,
    failOffsetX: -16,
    failOffsetY: [-16, 16],
    onUpdate: (e) => {
      'worklet'
      x.set(Math.max(0, e.translationX))
    },
    onDeactivate: (e) => {
      'worklet'
      const done = e.translationX > width * COMMIT || e.velocityX > FLICK
      if (!done) {
        x.set(withSpring(0, { stiffness: 400, damping: 36 }))
      } else if (reduced) {
        scheduleOnRN(goBack)
      } else {
        x.set(
          withTiming(width, { duration: 200, easing: Easing.out(Easing.cubic) }, (finished) => {
            if (finished) scheduleOnRN(goBack)
          }),
        )
      }
    },
  })

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    opacity: interpolate(x.value, [0, width], [1, 0.4]),
  }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>
    </GestureDetector>
  )
}
