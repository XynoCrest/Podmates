/**
 * Time scrubber: a time over a ruler. Drag the ruler under the centre mark and the time runs
 * with it; fling it and it coasts, then settles on the nearest step.
 *
 * One spring for the throw and the snap: on release the landing is decided at once (where the
 * ruler would coast at the speed it was let go, rounded to the nearest step), then one spring
 * carries it there starting with the hand's own velocity. A flick coasts, a slow release just
 * settles, and there's no seam between gliding and snapping.
 *
 * A dial seen from the front: the ruler fades out toward its edges, so the flat strip reads as
 * the face of a wheel. The digits roll as the time changes. A haptic tick for every step crossed.
 *
 * Ported from a web component; the ruler is drawn once and slid on the UI thread (Reanimated),
 * and React renders only when the shown minute changes.
 */
import { colors, radii, space } from '@podmates/ui-tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler'
import Animated, { cancelAnimation, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { haptics } from '@/lib/haptics'
import { Text } from './Text'

/** Points per minute along the ruler. */
const PX = 2
const RULER_H = 64
/** How far a release carries, in seconds at the speed it was let go. */
const CARRY_S = 0.35
/** Fastest throw, in minutes per second (a flick spins hours, never the whole day). */
const MAX_V = 600
/** How far past the first or last time a drag can stretch, in minutes (rubber band). */
const OVERPULL = 30
/** Near-critical: glides in and lands with a hint of give, no swing back. */
const SPRING = { stiffness: 140, damping: 22, mass: 1 }

function rubber(raw: number, min: number, max: number) {
  'worklet'
  const stretch = (over: number) => OVERPULL * (1 - 1 / (over / OVERPULL + 1))
  if (raw < min) return min - stretch(min - raw)
  if (raw > max) return max + stretch(raw - max)
  return raw
}

function label(m: number) {
  const t = Math.round(m)
  const h = Math.floor(t / 60)
  return { time: `${h % 12 || 12}:${String(t % 60).padStart(2, '0')}`, mer: h < 12 ? 'AM' : 'PM' }
}

const LINE = 40

/** A digit that rolls: a strip of 0–9 slides to it behind a window with soft top and bottom edges. */
function Digit({ d, bg }: { d: string; bg: string }) {
  return (
    <View style={{ height: LINE, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: -Number(d) * LINE }], transitionProperty: 'transform', transitionDuration: 220 }}>
        {'0123456789'.split('').map((n) => (
          <Text key={n} numeric style={{ height: LINE, fontSize: 34, lineHeight: LINE, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' }}>
            {n}
          </Text>
        ))}
      </Animated.View>
      <LinearGradient pointerEvents="none" colors={[bg, `${bg}00`]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6 }} />
      <LinearGradient pointerEvents="none" colors={[`${bg}00`, bg]} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6 }} />
    </View>
  )
}

export function TimeScrubber({
  value,
  onChange,
  min = 0,
  max = 1440 - 1,
  step = 15,
  caption,
}: {
  /** Minutes after midnight. */
  value: number
  onChange: (minutes: number) => void
  min?: number
  max?: number
  step?: number
  /** A small line under the time (the timezone). */
  caption?: string
}) {
  const bg = colors.raised
  const reduced = useReducedMotion()
  const pos = useSharedValue(value)
  const dragStart = useSharedValue(value)
  const dragged = useSharedValue(false)
  const [width, setWidth] = useState(0)
  const [shown, setShown] = useState(value)

  // A value from outside (a reset) glides there.
  useEffect(() => {
    if (Math.abs(pos.get() - value) > 0.5) pos.set(reduced ? value : withSpring(value, SPRING))
  }, [value, pos, reduced])

  // The readout follows the ruler minute by minute; a tick for every step crossed.
  useAnimatedReaction(
    () => Math.round(Math.min(max, Math.max(min, pos.value))),
    (now, before) => {
      if (now !== before) scheduleOnRN(setShown, now)
    },
  )
  useAnimatedReaction(
    () => Math.floor(pos.value / step),
    (now, before) => {
      if (before !== null && now !== before) scheduleOnRN(haptics.select)
    },
  )

  const settle = (to: number) => {
    if (to !== value) onChange(to)
  }

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-14, 14],
    onBegin: () => {
      'worklet'
      cancelAnimation(pos)
      dragStart.set(pos.value)
      dragged.set(false)
    },
    onActivate: () => {
      'worklet'
      dragged.set(true)
    },
    onUpdate: (e) => {
      'worklet'
      // Left is later: the ruler moves under a fixed mark.
      pos.set(rubber(dragStart.value - e.translationX / PX, min, max))
    },
    onDeactivate: (e) => {
      'worklet'
      const v = Math.max(-MAX_V, Math.min(MAX_V, -e.velocityX / PX))
      const land = Math.min(max, Math.max(min, Math.round((pos.value + v * CARRY_S) / step) * step))
      // The landing already includes the throw, so the spring starts with only part of the speed.
      pos.set(reduced ? land : withSpring(land, { ...SPRING, velocity: v * 0.6 }))
      scheduleOnRN(settle, land)
    },
    onFinalize: () => {
      'worklet'
      // A touch that never became a drag (a tap that caught it mid-glide): settle on the nearest step.
      if (dragged.value) return
      const land = Math.min(max, Math.max(min, Math.round(pos.value / step) * step))
      if (Math.abs(land - pos.value) > 0.01) {
        pos.set(reduced ? land : withSpring(land, SPRING))
        scheduleOnRN(settle, land)
      }
    },
  })

  const ruler = useAnimatedStyle(() => ({ transform: [{ translateX: width / 2 - pos.value * PX }] }))

  // The ruler, drawn once: a tick every 5 minutes, taller every 15, tallest on the hour with its label.
  const ticks: { m: number; kind: 'hour' | 'quarter' | 'five' }[] = []
  for (let m = Math.ceil(min / 5) * 5; m <= max; m += 5) ticks.push({ m, kind: m % 60 === 0 ? 'hour' : m % 15 === 0 ? 'quarter' : 'five' })

  const { time, mer } = label(shown)
  const nudge = (d: number) => {
    const to = Math.min(max, Math.max(min, Math.round(value / step) * step + d))
    pos.set(reduced ? to : withSpring(to, SPRING))
    settle(to)
  }

  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.card, paddingTop: space.md, overflow: 'hidden' }}>
      <View style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <View style={{ flexDirection: 'row' }}>
            {time.split('').map((c, i) =>
              c === ':' ? (
                <Text key={`c${i}`} style={{ fontSize: 34, lineHeight: LINE, fontWeight: '700' }}>
                  :
                </Text>
              ) : (
                <View key={time.length - i} style={{ width: 21 }}>
                  <Digit d={c} bg={bg} />
                </View>
              ),
            )}
          </View>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink.muted }}>{mer}</Text>
        </View>
        {caption ? <Text variant="caption">{caption}</Text> : null}
      </View>

      <GestureDetector gesture={pan}>
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          style={{ height: RULER_H, marginTop: space.sm, overflow: 'hidden' }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Daily snap time"
          accessibilityValue={{ text: `${time} ${mer}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? step : -step)}
        >
          <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0 }, ruler]}>
            {ticks.map((t) => (
              <View
                key={t.m}
                style={{
                  position: 'absolute',
                  left: t.m * PX - 1,
                  top: 10,
                  width: t.kind === 'hour' ? 2 : 1.5,
                  height: t.kind === 'hour' ? 22 : t.kind === 'quarter' ? 15 : 9,
                  borderRadius: 1,
                  backgroundColor: t.kind === 'five' ? colors.ink.subtle : colors.ink.muted,
                }}
              />
            ))}
            {ticks
              .filter((t) => t.kind === 'hour')
              .map((t) => {
                const h = t.m / 60
                return (
                  <Text key={`l${t.m}`} variant="caption" style={{ position: 'absolute', left: t.m * PX - 30, width: 60, top: 38, textAlign: 'center' }}>
                    {`${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`}
                  </Text>
                )
              })}
          </Animated.View>
          {/* The dial's face: ink falls away toward the edges. */}
          <LinearGradient pointerEvents="none" colors={[bg, `${bg}00`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%' }} />
          <LinearGradient pointerEvents="none" colors={[`${bg}00`, bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%' }} />
          {/* The centre mark. */}
          <View pointerEvents="none" style={{ position: 'absolute', left: width / 2 - 1.5, top: 4, width: 3, height: 32, borderRadius: 1.5, backgroundColor: colors.flame.DEFAULT }} />
        </View>
      </GestureDetector>
    </View>
  )
}
