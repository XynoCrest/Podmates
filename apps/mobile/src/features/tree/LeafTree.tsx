import { G, Path, Svg } from 'react-native-svg'

/**
 * The home hero's tree: a tapered trunk branching into pointed leaves (each with a midrib),
 * two leaves drifting down, and a soft mound with bushes. Flat fills in shades of dark and grey,
 * made to sit on the green hero band.
 */

const VIEW_W = 220
const VIEW_H = 200

/** Darkest to lightest. */
const SHADES = ['#0C2414', '#1C3324', '#2E4434', '#4B5D51', '#6F7F74']

/** [base x, base y, angle (deg, clockwise from straight up), length, shade index] */
const LEAVES: [number, number, number, number, number][] = [
  [111, 50, 6, 48, 2],
  [92, 74, -24, 40, 3],
  [130, 72, 26, 40, 1],
  [74, 62, -36, 42, 4],
  [152, 58, 34, 42, 2],
  [44, 104, -70, 42, 2],
  [178, 104, 70, 42, 3],
  [56, 108, -112, 38, 0],
  [166, 106, 114, 38, 4],
  [72, 113, -30, 36, 1],
  [150, 110, 30, 36, 0],
  [86, 120, -100, 34, 3],
  [134, 118, 100, 34, 1],
  [110, 96, -20, 34, 0],
  [111, 100, 22, 32, 4],
  [100, 130, -150, 30, 2],
  [120, 129, 152, 30, 3],
]

/** Leaves on their way down, not attached to a branch. */
const FALLING: [number, number, number, number, number][] = [
  [64, 160, 210, 26, 3],
  [166, 156, 158, 22, 1],
]

/** Branches: path, stroke width. */
const BRANCHES: [string, number][] = [
  ['M110,132 C109,106 108,82 111,50', 6],
  ['M108,142 C92,126 70,113 44,104', 5],
  ['M112,140 C130,123 152,111 178,104', 5],
  ['M109,116 C100,100 86,80 74,62', 4],
  ['M110,112 C122,94 138,76 152,58', 4],
  ['M109,96 C102,88 96,80 92,74', 3],
  ['M111,94 C118,86 124,79 130,72', 3],
  ['M66,110 L56,108', 2.5],
  ['M156,108 L166,106', 2.5],
  ['M92,124 L86,120', 2],
  ['M128,122 L134,118', 2],
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
    <Svg width={(height * VIEW_W) / VIEW_H} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      {/* Mound and bushes, behind the trunk */}
      <Path d="M14,200 C30,186 70,180 110,180 C150,180 190,186 206,200 Z" fill={SHADES[3]} opacity={0.55} />
      <Path d="M28,200 C26,190 34,182 44,184 C48,176 60,176 64,184 C72,182 78,190 76,200 Z" fill={SHADES[2]} opacity={0.6} />
      <Path d="M140,200 C138,188 148,180 158,184 C164,174 178,176 180,186 C190,186 194,194 192,200 Z" fill={SHADES[2]} opacity={0.6} />
      {/* Trunk, flaring at the base */}
      <Path d="M94,198 C102,176 104,152 106,128 L114,128 C116,152 118,176 126,198 Z" fill={SHADES[0]} />
      {BRANCHES.map(([d, w]) => (
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
