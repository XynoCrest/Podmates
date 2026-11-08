import { G, Path, Svg } from 'react-native-svg'

/**
 * The home hero's tree. It grows in from the right edge: the trunk leans in low and rises in one
 * gentle curve towards upright, like a natural limb, branching into pointed leaves, each with a midrib,
 * with two leaves drifting down. Flat fills in shades of dark and grey for the green hero band.
 * Its right edge is meant to sit flush with the screen's, so the trunk reads as coming from off-screen.
 */

/** The drawing spans x = VIEW_X…200; left of 0 is room for the slim limb reaching towards the text. */
const VIEW_X = -22
const VIEW_W = 200 - VIEW_X
const VIEW_H = 200

/** Darkest to lightest. */
const SHADES = ['#0C2414', '#1C3324', '#2E4434', '#4B5D51', '#6F7F74']

/** The trunk in tapering pieces: in from the right edge, low, rising in a gentle curve to upright. Path, width. */
const TRUNK: [string, number][] = [
  ['M206,186 C176,180 148,168 128,150', 15],
  ['M128,150 C112,135 100,116 93,94', 12],
  ['M93,94 C88,76 86,58 86,40', 8.5],
  ['M86,44 C86,40 87,37 87,34', 5],
]

/** Branches: path, width. */
const BRANCHES: [string, number][] = [
  ['M168,173 C166,159 168,147 174,136', 3.5],
  ['M142,162 C144,147 149,135 156,124', 3.5],
  ['M106,124 C92,118 76,114 58,114', 4],
  ['M95,100 C108,90 120,84 134,82', 4],
  ['M89,74 C78,64 68,56 58,50', 3],
  ['M87,60 C97,52 107,46 117,42', 3],
  ['M84,116 L74,114', 2],
  // A slim limb reaching left towards the text, a short twig hanging off it
  ['M91,86 C82,83 70,81 54,81 C42,81 32,82 22,84', 2.5],
  ['M48,81 C46,85 43,88 39,90', 1.5],
]

/** [base x, base y, angle (deg, clockwise from straight up), length, shade index] */
const LEAVES: [number, number, number, number, number][] = [
  [87, 36, 4, 34, 2],
  [58, 50, -45, 38, 3],
  [117, 42, 45, 38, 1],
  [68, 57, -10, 30, 0],
  [103, 48, -4, 30, 4],
  [58, 114, -78, 38, 2],
  [74, 114, -132, 32, 0],
  [86, 118, -165, 28, 3],
  [134, 82, 70, 38, 3],
  [120, 85, 18, 32, 4],
  [102, 94, -22, 28, 0],
  [156, 124, 24, 36, 1],
  [147, 140, -24, 30, 4],
  [174, 136, 18, 32, 2],
  [169, 151, -34, 28, 3],
  [154, 167, -8, 26, 2],
  [188, 182, 12, 24, 4],
  [124, 146, -42, 26, 0],
  [112, 136, -108, 28, 4],
  [95, 104, -70, 26, 1],
  // The slim limb's two leaves
  [22, 84, -96, 26, 3],
  [64, 81, -48, 24, 1],
]

/** Leaves on their way down, not attached to a branch. */
const FALLING: [number, number, number, number, number][] = [
  [36, 150, 210, 22, 3],
  [70, 176, 188, 18, 2],
]

function Leaf({ x, y, angle, length, shade }: { x: number; y: number; angle: number; length: number; shade: number }) {
  const w = length * 0.4
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d={`M0,0 C${w},${-length * 0.25} ${w},${-length * 0.7} 0,${-length} C${-w},${-length * 0.7} ${-w},${-length * 0.25} 0,0 Z`} fill={SHADES[shade]} />
      <Path d={`M0,${-length * 0.08} L0,${-length * 0.82}`} stroke="rgba(255,255,255,0.16)" strokeWidth={1} strokeLinecap="round" />
    </G>
  )
}

export function LeafTree({ height }: { height: number }) {
  return (
    <Svg width={(height * VIEW_W) / VIEW_H} height={height} viewBox={`${VIEW_X} 0 ${VIEW_W} ${VIEW_H}`}>
      {/* A bush at the edge where the trunk comes in */}
      <Path d="M168,200 C164,188 174,180 184,184 C188,174 202,174 206,184 L206,200 Z" fill={SHADES[2]} opacity={0.6} />
      {[...TRUNK, ...BRANCHES].map(([d, w]) => (
        <Path key={d} d={d} stroke={SHADES[0]} strokeWidth={w} strokeLinecap="round" fill="none" />
      ))}
      {LEAVES.map(([x, y, angle, length, shade]) => (
        <Leaf key={`${x},${y}`} x={x} y={y} angle={angle} length={length} shade={shade} />
      ))}
      {FALLING.map(([x, y, angle, length, shade]) => (
        <Leaf key={`f${x},${y}`} x={x} y={y} angle={angle} length={length} shade={shade} />
      ))}
    </Svg>
  )
}
