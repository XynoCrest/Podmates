import Svg, { Path } from 'react-native-svg'
import { GROVE_ASPECT, GROVE_PATHS, GROVE_VIEWBOX } from './grovePaths'

/**
 * The Grove hairline tree, at rest: one stroke colour in three weights, plates filled
 * with the ground they sit on so the drawing stays honest (nearer leaves hide farther ones).
 * `ground` must match the surface behind it.
 */
export function GroveFigure({ height, ground, ink = '#FFFFFF' }: { height: number; ground: string; ink?: string }) {
  return (
    <Svg width={height * GROVE_ASPECT} height={height} viewBox={GROVE_VIEWBOX}>
      {GROVE_PATHS.map(([kind, d], i) => (
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
