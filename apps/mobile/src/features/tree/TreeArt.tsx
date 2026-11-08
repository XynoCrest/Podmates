import { stageFor } from '@podmates/tree-engine'
import { useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { SvgXml } from 'react-native-svg'
import { treeSvg } from './treeSvgs'

/**
 * The pod's tree, picked by stage (growth): seed, sprout, sapling, young, full.
 * A dead (dormant) tree shows the grey "resting" drawing of its stage.
 * `still` turns off the breathing swell (small thumbnails in lists).
 */
export function TreeArt({ growth, dead = false, size = 220, still }: { growth: number; dead?: boolean; size?: number; still?: boolean }) {
  const { level } = stageFor(growth)

  // Breathing: a slow 2% swell. Off for Reduce Motion, dead trees and thumbnails.
  const reduced = useReducedMotion()
  const breath = useSharedValue(0)
  const animate = !reduced && !dead && !still
  useEffect(() => {
    if (!animate) return
    breath.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true)
  }, [animate, breath])
  const sway = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breath.value * 0.02 }, { translateY: -breath.value * 2 }] }))

  return (
    <Animated.View style={[{ width: size, height: size }, sway]} accessibilityRole="image" accessibilityLabel={`${dead ? 'Resting' : 'Growing'} tree, stage ${level}`}>
      <SvgXml xml={treeSvg(level, dead)} width={size} height={size} />
    </Animated.View>
  )
}
