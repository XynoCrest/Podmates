import Svg, { Path } from 'react-native-svg'
import { GROVE_ASPECT, GROVE_PATHS, GROVE_VIEWBOX } from './grovePaths'

/** The hero band behind the Grove figure: a neutral green, with dark ink on it (Home, onboarding). */
export const HERO = { bg: '#46A862', ink: '#0C2414', soft: 'rgba(12, 36, 20, 0.72)' }

/** A Hairline figure's rest pose: paths painted back to front. */
export interface HairlineDrawing {
  viewBox: string
  aspect: number
  paths: readonly (readonly ['sil' | 'lo' | 'limb' | 'hi', string])[]
}

/**
 * A Hairline figure at rest: one stroke colour in three weights, plates filled with the
 * ground they sit on so the drawing stays honest (nearer parts hide farther ones).
 * `ground` must match the surface behind it.
 */
export function HairlineFigure({ drawing, height, ground, ink = '#FFFFFF' }: { drawing: HairlineDrawing; height: number; ground: string; ink?: string }) {
  return (
    <Svg width={height * drawing.aspect} height={height} viewBox={drawing.viewBox}>
      {drawing.paths.map(([kind, d], i) => (
        <Path
          key={i}
          d={d}
          fill={kind === 'sil' || kind === 'hi' ? ground : 'none'}
          stroke={ink}
          strokeOpacity={kind === 'hi' ? 1 : kind === 'lo' ? 0.45 : 0.8}
          strokeWidth={kind === 'hi' ? 1.6 : kind === 'lo' ? 0.8 : 1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </Svg>
  )
}

const GROVE: HairlineDrawing = { viewBox: GROVE_VIEWBOX, aspect: GROVE_ASPECT, paths: GROVE_PATHS }

/** The Grove hairline tree (Home's hero, onboarding's last step). */
export function GroveFigure({ height, ground, ink = '#FFFFFF' }: { height: number; ground: string; ink?: string }) {
  return <HairlineFigure drawing={GROVE} height={height} ground={ground} ink={ink} />
}
