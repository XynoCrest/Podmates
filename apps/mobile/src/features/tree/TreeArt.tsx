import { stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'

/**
 * The pod's tree, drawn from its stage (growth) and health (hp / max_hp).
 * Leaves yellow then brown as health drops; a dead tree is bare. It stands in a
 * raised garden bed: the plot the pod tends together.
 */
export function TreeArt({ growth, health, dead = false, size = 220 }: { growth: number; health: number; dead?: boolean; size?: number }) {
  const { level } = stageFor(growth)
  const leaf = dead ? '#5B5148' : leafColor(health)
  const leafLight = dead ? '#6B6158' : mix(leaf, '#FFFFFF', 0.28)
  const leafDark = dead ? '#463E37' : mix(leaf, '#000000', 0.25)

  const groundY = 176
  const trunkW = 6 + level * 2.4
  const trunkH = level >= 3 ? 26 + level * 8 : 0
  const topY = groundY - trunkH
  const r = 16 + level * 5

  return (
    // The top of the canvas is only used by the tallest stages, so it's trimmed.
    <View style={{ width: size, height: size * 0.92 }}>
        <Svg width={size} height={size * 0.92} viewBox="0 16 200 184">
          {/* Raised bed: wooden sides, dark soil, a few pebbles. */}
          <Rect x={34} y={groundY - 2} width={132} height={20} rx={6} fill="#5a4330" />
          <Rect x={34} y={groundY - 2} width={132} height={6} rx={3} fill="#6e5440" />
          <Ellipse cx={100} cy={groundY - 1} rx={62} ry={6} fill="#2b2119" />
          <Circle cx={58} cy={groundY - 2} r={2} fill="#4a3c30" />
          <Circle cx={146} cy={groundY - 3} r={2.5} fill="#4a3c30" />
          <Path d={`M48 ${groundY + 10} h20 M90 ${groundY + 10} h24 M134 ${groundY + 10} h16`} stroke="#4a3626" strokeWidth={2} strokeLinecap="round" />

          {level === 1 ? (
            // Seed: a mound with the first leaf poking out.
            <G>
              <Ellipse cx={100} cy={groundY - 2} rx={20} ry={9} fill="#5A3E2B" />
              <Path d={`M100 ${groundY - 8} q-2 -10 6 -16`} stroke={leafDark} strokeWidth={3} fill="none" strokeLinecap="round" />
              <Ellipse cx={109} cy={groundY - 26} rx={9} ry={5} fill={leaf} transform={`rotate(-35 109 ${groundY - 26})`} />
            </G>
          ) : level === 2 ? (
            // Sprout: stem and two leaves.
            <G>
              <Path d={`M100 ${groundY} C100 ${groundY - 20} 98 ${groundY - 34} 100 ${groundY - 48}`} stroke="#7A5638" strokeWidth={5} fill="none" strokeLinecap="round" />
              <Ellipse cx={86} cy={groundY - 44} rx={15} ry={8} fill={leaf} transform={`rotate(25 86 ${groundY - 44})`} />
              <Ellipse cx={114} cy={groundY - 52} rx={15} ry={8} fill={leafLight} transform={`rotate(-25 114 ${groundY - 52})`} />
            </G>
          ) : (
            <G>
              {/* Trunk with two branch stubs so the crown reads as held up. */}
              <Rect x={100 - trunkW / 2} y={topY} width={trunkW} height={trunkH + 2} rx={trunkW / 2} fill="#7A5638" />
              <Rect x={100 - trunkW / 2 + trunkW * 0.55} y={topY + 4} width={trunkW * 0.3} height={trunkH - 6} rx={trunkW * 0.15} fill="#8E6844" />
              <Path d={`M100 ${topY + trunkH * 0.45} l-${r * 0.5} -${r * 0.35}`} stroke="#7A5638" strokeWidth={trunkW * 0.45} strokeLinecap="round" />
              <Path d={`M100 ${topY + trunkH * 0.3} l${r * 0.45} -${r * 0.4}`} stroke="#7A5638" strokeWidth={trunkW * 0.4} strokeLinecap="round" />
              {dead ? (
                <G>
                  <Path d={`M100 ${topY} l-${r * 0.3} -${r * 0.6} M100 ${topY} l${r * 0.35} -${r * 0.5} M100 ${topY + 6} l${r * 0.6} -${r * 0.2}`} stroke="#6B5444" strokeWidth={3} strokeLinecap="round" />
                  <Ellipse cx={128} cy={groundY - 3} rx={6} ry={3} fill={leaf} transform={`rotate(20 128 ${groundY - 3})`} />
                </G>
              ) : (
                <G>
                  <Circle cx={100 - r * 0.8} cy={topY} r={r * 0.75} fill={leafDark} />
                  <Circle cx={100 + r * 0.8} cy={topY} r={r * 0.75} fill={leafDark} />
                  {level >= 5 ? <Circle cx={100 - r * 0.45} cy={topY - r * 1.1} r={r * 0.7} fill={leaf} /> : null}
                  {level >= 5 ? <Circle cx={100 + r * 0.5} cy={topY - r * 1.05} r={r * 0.68} fill={leaf} /> : null}
                  <Circle cx={100} cy={topY - r * 0.6} r={r} fill={leaf} />
                  {/* Light catching the top-left of each mass. */}
                  <Circle cx={100 - r * 0.32} cy={topY - r * 0.95} r={r * 0.32} fill={leafLight} opacity={0.9} />
                  <Circle cx={100 - r * 1.0} cy={topY - r * 0.25} r={r * 0.22} fill={leaf} opacity={0.9} />
                  {level >= 6
                    ? [
                        [-0.5, -0.3],
                        [0.4, -0.7],
                        [0.9, 0.1],
                        [-0.1, -1.4],
                        [-0.9, 0.2],
                      ].map(([dx, dy], i) => <Circle key={i} cx={100 + r * dx!} cy={topY + r * dy!} r={3.6} fill={colors.sun.DEFAULT} />)
                    : null}
                </G>
              )}
            </G>
          )}
        </Svg>
    </View>
  )
}

/** Healthy green → tired yellow-green → wilting brown. */
function leafColor(health: number) {
  const h = Math.min(1, Math.max(0, health))
  if (h > 0.5) return mix('#C2C24A', colors.leaf.DEFAULT, (h - 0.5) / 0.5)
  return mix('#9A6B3A', '#C2C24A', h / 0.5)
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t)
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}
