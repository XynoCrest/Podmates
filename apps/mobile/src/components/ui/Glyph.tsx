import { colors } from '@podmates/ui-tokens'
import type { ColorValue } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

/**
 * Hand-drawn line glyphs for the home screen: the habit marks that sit in a
 * streak ring and next to a podmate's count, plus the pea-pod wordmark.
 *
 * These are deliberately NOT SF Symbols. A habit mark has to render identically
 * on iOS, Android and web next to a number, and it has to survive being drawn at
 * 15px inside a ring badge, which the system symbols don't do consistently.
 */
const stroke = {
  fill: 'none',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export type GlyphName = 'read' | 'swim' | 'run' | 'walk' | 'lift' | 'meditate' | 'leaf' | 'heart' | 'plus'

function Paths({ name, color }: { name: GlyphName; color: ColorValue }) {
  const s = { ...stroke, stroke: color }
  switch (name) {
    case 'read':
      return (
        <>
          <Path
            {...s}
            d="M12 7.3C10.4 6 8.6 5.4 6 5.4c-.7 0-1.2.5-1.2 1.2v9.6c0 .7.5 1.2 1.2 1.2 2.6 0 4.4.6 6 1.9 1.6-1.3 3.4-1.9 6-1.9.7 0 1.2-.5 1.2-1.2V6.6c0-.7-.5-1.2-1.2-1.2-2.6 0-4.4.6-6 1.9Z"
          />
          <Path {...s} d="M12 7.3v11" />
        </>
      )
    case 'swim':
      return (
        <>
          <Circle {...s} cx={17.2} cy={7.4} r={1.9} />
          <Path {...s} d="M5.6 12.4l6.6 1.5 4-2.5" />
          <Path {...s} d="M3 18c1.8-1.6 3.6-1.6 5.4 0 1.8 1.6 3.6 1.6 5.4 0 1.8-1.6 3.6-1.6 5.4 0 .6.5 1.2.8 1.8.8" />
        </>
      )
    case 'run':
      return (
        <>
          <Circle {...s} cx={15.4} cy={5.2} r={1.9} />
          <Path {...s} d="M14.2 9c1.4-.2 2.4.4 2.9 1.6l.7 1.7 2.4 1.1" />
          <Path {...s} d="M15.2 13.1l1.1 2.9 1.8 3.4" />
          <Path {...s} d="M14.6 10.5l-3.8 3.3-1.6 3.4" />
          <Path {...s} d="M10.6 8.6 6.9 7.9" />
        </>
      )
    case 'walk':
      return (
        <>
          <Circle {...s} cx={13.2} cy={4.9} r={1.9} />
          <Path {...s} d="M12.4 8.6c1.3 0 2.1.7 2.4 1.9l.6 2.4 2 1.4" />
          <Path {...s} d="M13.4 12.9l.5 3.1 1.1 4" />
          <Path {...s} d="M12.6 10.8 9.9 14l-.8 5.9" />
        </>
      )
    case 'lift':
      return (
        <>
          <Path {...s} d="M4 9.2v5.6M7 7.6v8.8M17 7.6v8.8M20 9.2v5.6" />
          <Path {...s} d="M7 12h10" />
        </>
      )
    case 'meditate':
      return (
        <>
          <Circle {...s} cx={12} cy={5.4} r={2} />
          <Path {...s} d="M12 9.2v4.4" />
          <Path {...s} d="M12 13.6c-2.9 0-5.6 1.6-6.6 4.2-.3.7.2 1.4.9 1.4h11.4c.7 0 1.2-.7.9-1.4-1-2.6-3.7-4.2-6.6-4.2Z" />
        </>
      )
    case 'leaf':
      return (
        <>
          <Path {...s} d="M19.4 4.6c-8 0-13 3.6-13 9.1 0 2.1.9 3.9 2.2 5.1 2.9-5.4 6.3-8 10.8-9.1-3.6 1.9-6.6 5-8.4 9.6 5.9.8 9.4-4.1 9.4-10.3 0-1.6-.4-3.1-1-4.4Z" />
        </>
      )
    case 'heart':
      return (
        <Path
          fill={color as string}
          d="M12 20.6S2.8 15 2.8 9.2C2.8 6.3 5 4.3 7.6 4.3c1.8 0 3.4 1 4.4 2.6 1-1.6 2.6-2.6 4.4-2.6 2.6 0 4.8 2 4.8 4.9 0 5.8-9.2 11.4-9.2 11.4Z"
        />
      )
    case 'plus':
      return <Path {...s} strokeWidth={2.2} d="M12 5.6v12.8M5.6 12h12.8" />
  }
}

export function Glyph({ name, size = 22, color = colors.ink.DEFAULT }: { name: GlyphName; size?: number; color?: ColorValue }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Paths name={name} color={color} />
    </Svg>
  )
}

const BY_KEYWORD: [RegExp, GlyphName][] = [
  [/read|book/i, 'read'],
  [/swim|pool/i, 'swim'],
  [/run|jog|cardio/i, 'run'],
  [/walk|step|hike/i, 'walk'],
  [/lift|gym|weight|strength/i, 'lift'],
  [/meditat|mindful|yoga|journal/i, 'meditate'],
]

/** Habit name (from the database) → the glyph that reads best for it. */
export function glyphFor(habitName: string | undefined): GlyphName {
  return BY_KEYWORD.find(([re]) => re.test(habitName ?? ''))?.[1] ?? 'leaf'
}

/** The pea-pod wordmark that sits beside "Peas" in the header. */
export function PeaPodMark({ width = 46, color = colors.leaf.DEFAULT }: { width?: number; color?: ColorValue }) {
  return (
    <Svg width={width} height={(width * 84) / 160} viewBox="0 0 160 84">
      <Path
        fill="none"
        stroke={color as string}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 30c-6-9-2-19 7-21 8-2 13 5 10 11"
      />
      <Path
        fill="none"
        stroke={color as string}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M30 44c0-14 16-24 48-24s52 10 52 24-20 24-52 24-48-10-48-24Z"
      />
      <Circle cx={56} cy={44} r={9} fill="none" stroke={color as string} strokeWidth={4} />
      <Circle cx={80} cy={44} r={9} fill="none" stroke={color as string} strokeWidth={4} />
      <Circle cx={104} cy={44} r={9} fill="none" stroke={color as string} strokeWidth={4} />
    </Svg>
  )
}
