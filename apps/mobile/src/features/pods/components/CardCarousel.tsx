/**
 * A carousel of cards with hairline figures, ported from the trading app's strategy carousel. Used for
 * the "Start a pod" habit picker (HabitCarousel) and the profile's habit streak cards.
 *
 * The centre card is light grey (#DBDBDB) and full size; the others shrink with their
 * distance from it (a medium card beside it, then narrower slivers showing a cropped middle of their
 * card) and darken and dim.
 *
 * Every card's size, place and colour follow one continuous position (`pos`, in cards): moving from
 * card 2 to 3 runs it from 2 to 3, so halfway both cards are the same medium size side by side.
 *
 * Two motions, by what starts the move:
 * - Arrows, dots and a tap on a side card slide to their card: a timed ease-in-out sine, 420 ms for
 *   one card and 90 ms more per card past it (at most 750 ms).
 * - A drag moves the cards 1:1 (rubber-banded past the ends); on release its speed projects the
 *   landing 0.32 s ahead (a flick over 400 pt/s moves at least one card) and a critically damped
 *   spring takes the cards there, keeping that speed.
 * - The caption under the arrows and dots swaps with the centre card, rising 8pt and fading in.
 * - Tapping the centre card squishes it, then calls `onPickCentre` if given.
 *
 * `pos` is a Reanimated shared value: cards restyle on the UI thread with no React renders; React
 * renders only when the centre card changes.
 */
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { usePanGesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { Icon, PressableScale } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import { HabitDiagram } from './habitDiagrams'

/** A card's [width, height, opacity] by its distance from the centre; past the last it's gone. Sized for a phone-wide band. */
const TIERS: [number, number, number][] = [
  [196, 188, 1],
  [72, 144, 0.75],
  [20, 124, 0.55],
  [10, 110, 0.4],
  [6, 100, 0.25],
]
const GAP = 6
const CARD_W = TIERS[0][0]
const CARD_H = TIERS[0][1]
const BAND_H = 228
/** Each tier's centre from the carousel's middle: the widths and gaps before it. */
const CENTRES = TIERS.reduce<number[]>((acc, [w], i) => {
  acc.push(i === 0 ? 0 : acc[i - 1]! + TIERS[i - 1]![0] / 2 + GAP + w / 2)
  return acc
}, [])
/** Points per card: the distance between the centre and the next card's centre. */
const CARD_PX = CENTRES[1]!

const SLIDE_MS = 420
const SLIDE_PER_CARD_MS = 90
const SLIDE_MAX_MS = 750
/** Ease-in-out sine, (1 − cos πt) / 2: smooth ends, close to linear through the middle. */
const SLIDE_EASE = Easing.inOut(Easing.sin)
/** Settling spring: critically damped (damping = 2√k for mass 1). */
const SETTLE_STIFFNESS = 55
const PROJECT_S = 0.32
const FLICK_PT_S = 400
/** How far past the first and last card a drag can stretch at most, in cards (rubber band). */
const OVERPULL = 0.12

/** Card palette, as in the trading app. */
const C = {
  band: '#0F0F0F',
  bandLine: '#1F1F1F',
  side: '#161616',
  centre: '#DBDBDB',
  sideInk: '#737373',
  centreInk: '#0A0A0A',
  centreLabel: '#525252',
  sideName: '#A1A1A1',
  caption: '#A1A1A1',
  dot: '#525252',
}

/** One card: its figure (habitDiagrams id), small caps label, title, line under it, and the caption shown while it's centred. */
export interface CarouselItem {
  id: string
  figure: string
  label: string
  title: string
  sub: string
  about: string
  a11y: string
}

function stretch(over: number) {
  'worklet'
  return OVERPULL * (1 - 1 / (over / OVERPULL + 1))
}

/** A raw drag position past the ends, stretched like rubber. Inside the cards it's unchanged. */
function rubberBand(raw: number, last: number) {
  'worklet'
  if (raw < 0) return -stretch(-raw)
  if (raw > last) return last + stretch(raw - last)
  return raw
}

/** The tiers' values at a fractional distance, linearly between whole ones. */
function tier(distance: number) {
  'worklet'
  const d = Math.min(Math.abs(distance), TIERS.length - 1)
  const i = Math.min(Math.floor(d), TIERS.length - 2)
  const f = d - i
  const a = TIERS[i]!
  const b = TIERS[i + 1]!
  const lerp = (x: number, y: number) => x + (y - x) * f
  return { w: lerp(a[0], b[0]), h: lerp(a[1], b[1]), opacity: lerp(a[2], b[2]), centre: Math.sign(distance) * lerp(CENTRES[i]!, CENTRES[i + 1]!) }
}

export function CardCarousel({
  items,
  index,
  onIndex,
  onPickCentre,
  label,
}: {
  items: CarouselItem[]
  /** The card chosen: the carousel glides to it. */
  index: number
  onIndex: (index: number) => void
  /** Tapping the settled centre card (after its squish). */
  onPickCentre?: (index: number) => void
  /** Names the group and the arrows ("Habit" → "Previous habit"). */
  label: string
}) {
  const last = Math.max(0, items.length - 1)
  const reduced = useReducedMotion()
  const pos = useSharedValue(index)
  const dragStart = useSharedValue(0)
  const press = useSharedValue(1)
  const [centre, setCentre] = useState(index)

  // The centre card: React renders when it changes, not per frame.
  useAnimatedReaction(
    () => Math.round(Math.min(Math.max(pos.value, 0), last)),
    (now, before) => {
      if (now !== before) scheduleOnRN(setCentre, now)
    },
  )

  const commit = (to: number) => {
    if (to !== index && items[to]) {
      haptics.select()
      onIndex(to)
    }
  }

  /** Slide to a card: eased and timed, from wherever the cards are (arrows, dots, taps). */
  const slideTo = (target: number) => {
    const to = Math.min(Math.max(target, 0), last)
    const cards = Math.abs(to - pos.get())
    const ms = Math.min(SLIDE_MAX_MS, SLIDE_MS + Math.max(0, cards - 1) * SLIDE_PER_CARD_MS)
    pos.set(reduced ? to : withTiming(to, { duration: ms, easing: SLIDE_EASE }))
    commit(to)
  }

  // A card chosen elsewhere (or the list loading) slides there.
  useEffect(() => {
    if (Math.round(pos.get()) !== index) pos.set(reduced ? index : withTiming(index, { duration: SLIDE_MS, easing: SLIDE_EASE }))
  }, [index, pos, reduced])

  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet'
      cancelAnimation(pos)
      dragStart.set(pos.value)
    },
    onUpdate: (e) => {
      'worklet'
      pos.set(rubberBand(dragStart.value - e.translationX / CARD_PX, last))
    },
    onDeactivate: (e) => {
      'worklet'
      // Speed in cards/s, positive towards later cards.
      const speed = -e.velocityX / CARD_PX
      const clamp = (p: number) => Math.min(Math.max(p, 0), last)
      let landing = Math.round(clamp(pos.value + speed * PROJECT_S))
      if (Math.abs(e.velocityX) > FLICK_PT_S && landing === Math.round(clamp(pos.value))) landing = clamp(landing + Math.sign(speed))
      pos.set(reduced ? landing : withSpring(landing, { stiffness: SETTLE_STIFFNESS, damping: 2 * Math.sqrt(SETTLE_STIFFNESS), mass: 1, velocity: speed }))
      scheduleOnRN(commit, landing)
    },
  })

  const tapCard = (i: number) => {
    if (i === centre && Math.abs(pos.get() - i) < 0.02) {
      haptics.select()
      press.set(reduced ? 1 : withSequence(withTiming(0.95, { duration: 90 }), withSpring(1, { stiffness: 400, damping: 22 })))
      // The pick lands once the squish has shown.
      if (onPickCentre) setTimeout(() => onPickCentre(i), reduced ? 0 : 140)
    } else slideTo(i)
  }

  const current = items[Math.min(centre, last)]
  if (!current) return null

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      <GestureDetector gesture={pan}>
        <View style={{ height: BAND_H, overflow: 'hidden', backgroundColor: C.band, borderBottomWidth: 1, borderTopWidth: 1, borderColor: C.bandLine }}>
          {items.map((item, i) => (
            <Card key={item.id} item={item} index={i} pos={pos} press={press} centre={i === centre} onPress={() => tapCard(i)} />
          ))}
        </View>
      </GestureDetector>

      <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <ArrowButton icon="back" label={`Previous ${label.toLowerCase()}`} disabled={centre === 0} onPress={() => slideTo(centre - 1)} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {items.map((item, i) => (
            <Pressable key={item.id} onPress={() => slideTo(i)} accessibilityLabel={item.title} hitSlop={6}>
              <View
                style={{
                  height: 8,
                  width: i === centre ? 24 : 8,
                  borderRadius: 4,
                  backgroundColor: i === centre ? '#FFFFFF' : C.dot,
                  transitionProperty: ['width', 'backgroundColor'],
                  transitionDuration: reduced ? 0 : 300,
                }}
              />
            </Pressable>
          ))}
        </View>
        <ArrowButton icon="chevronRight" label={`Next ${label.toLowerCase()}`} disabled={centre === last} onPress={() => slideTo(centre + 1)} />
      </View>

      {/* A new centre card's caption rises 8pt and fades in (520 ms, a soft ease-out). */}
      <Animated.View key={current.id} entering={reduced ? undefined : rise} style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 }}>
        <Animated.Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>{current.title}</Animated.Text>
        <Animated.Text style={{ marginTop: 6, fontSize: 14, lineHeight: 22, color: C.caption }}>{current.about}</Animated.Text>
      </Animated.View>
    </View>
  )
}

/** Caption entrance: up 8pt and in from transparent, 520 ms on cubic-bezier(0.22, 1, 0.36, 1). */
function rise() {
  'worklet'
  const config = { duration: 520, easing: Easing.bezier(0.22, 1, 0.36, 1) }
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 8 }] },
    animations: { opacity: withTiming(1, config), transform: [{ translateY: withTiming(0, config) }] },
  }
}

function ArrowButton({ icon, label, disabled, onPress }: { icon: 'back' | 'chevronRight'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityLabel={label} scaleTo={0.9}>
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}>
        <Icon name={icon} size={15} color={C.caption} weight="semibold" />
      </View>
    </PressableScale>
  )
}

/** One card, every style computed from the carousel's position on the UI thread. */
function Card({ item, index, pos, press, centre, onPress }: { item: CarouselItem; index: number; pos: SharedValue<number>; press: SharedValue<number>; centre: boolean; onPress: () => void }) {
  const frame = useAnimatedStyle(() => {
    const distance = index - pos.value
    const t = tier(distance)
    // 1 on the centre card, 0 from one card away: the light card and its dark text fade in.
    const lit = Math.max(0, 1 - Math.abs(distance))
    return {
      width: t.w,
      height: t.h,
      top: (BAND_H - t.h) / 2,
      opacity: Math.abs(distance) > TIERS.length - 0.5 ? 0 : t.opacity,
      zIndex: 100 - Math.round(Math.abs(distance) * 10),
      borderRadius: 12 + 8 * Math.min(1, t.w / CARD_W),
      backgroundColor: interpolateColor(lit, [0, 1], [C.side, C.centre]),
      shadowOpacity: 0.55 * lit,
      transform: [{ translateX: t.centre - t.w / 2 }, { scale: centre ? press.value : 1 }],
    }
  })
  // The card's content at full size, scaled to the card's height and cropped to its width.
  const content = useAnimatedStyle(() => {
    const t = tier(index - pos.value)
    return { left: (t.w - CARD_W) / 2, transform: [{ scale: t.h / CARD_H }] }
  })
  const lit = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(index - pos.value)) }))
  const ink = useAnimatedStyle(() => ({ color: interpolateColor(Math.max(0, 1 - Math.abs(index - pos.value)), [0, 1], [C.sideInk, C.centreInk]) }))
  const label = useAnimatedStyle(() => ({ color: interpolateColor(Math.max(0, 1 - Math.abs(index - pos.value)), [0, 1], [C.sideInk, C.centreLabel]) }))
  const name = useAnimatedStyle(() => ({ color: interpolateColor(Math.max(0, 1 - Math.abs(index - pos.value)), [0, 1], [C.sideName, C.centreInk]) }))

  return (
    <Animated.View style={[{ position: 'absolute', left: '50%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowRadius: 20 }, frame]}>
      <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: centre }} accessibilityLabel={item.a11y} style={{ flex: 1 }}>
        <Animated.View style={[{ position: 'absolute', top: 0, width: CARD_W, height: CARD_H, paddingHorizontal: 16, paddingVertical: 14, transformOrigin: 'top center' }, content]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.Text numberOfLines={1} style={[{ flex: 1, fontSize: 11, fontWeight: '500', letterSpacing: 1.76, textTransform: 'uppercase' }, label]}>
              {item.label}
            </Animated.Text>
            <View>
              <Icon name="arrowUpRight" size={13} color={C.sideInk} weight="medium" />
              <Animated.View style={[{ position: 'absolute' }, lit]}>
                <Icon name="arrowUpRight" size={13} color={C.centreInk} weight="medium" />
              </Animated.View>
            </View>
          </View>
          {/* The figure drawn twice, grey and dark; the dark one fades in on the centre card. */}
          <View style={{ marginTop: 12, height: 76 }}>
            <HabitDiagram id={item.figure} color={C.sideInk} width={CARD_W - 32} height={76} />
            <Animated.View style={[{ position: 'absolute', inset: 0 }, lit]}>
              <HabitDiagram id={item.figure} color={C.centreInk} width={CARD_W - 32} height={76} />
            </Animated.View>
          </View>
          <Animated.Text numberOfLines={1} style={[{ marginTop: 'auto', fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: -0.4 }, name]}>
            {item.title}
          </Animated.Text>
          <Animated.Text numberOfLines={1} style={[{ marginTop: 2, fontSize: 12 }, ink]}>
            {item.sub}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
