/**
 * Hairline figures for the habit cards (HabitCarousel): thin-line drawings of each habit in one
 * colour, with a single filled dot as the figure's point of attention. Strokes stay 1pt at any size
 * (`vectorEffect="non-scaling-stroke"`). The style follows the strategy diagrams in the trading app.
 *
 * A habit without a drawing of its own gets a dot grid seeded by its id, so a new habit in the
 * catalogue still has a card picture. Add one to DIAGRAMS by habit id.
 */
import type { ReactNode } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

const W = 160
const H = 80

/** A polyline through f(x), sampled every 4 units across the drawing. */
function trace(f: (x: number) => number): string {
  const points: string[] = []
  for (let x = 0; x <= W; x += 4) points.push(`${x},${f(x).toFixed(2)}`)
  return `M${points.join('L')}`
}

/** A polyline through f(x) from x0 to x1 (sampled every 4 units, both ends included). */
function span(f: (x: number) => number, x0: number, x1: number, step = 4): string {
  const points: string[] = []
  for (let x = x0; x < x1; x += step) points.push(`${x},${f(x).toFixed(2)}`)
  points.push(`${x1},${f(x1).toFixed(2)}`)
  return `M${points.join('L')}`
}

type Draw = (c: string) => ReactNode
const line = (c: string) => ({ fill: 'none', stroke: c, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const })

/** Reading: an open book, lines of text on both pages, the dot where you are on the right page. */
const Reading: Draw = (c) => (
  <>
    <Path d="M80,22 Q50,10 16,18 L16,62 Q50,54 80,66" {...line(c)} />
    <Path d="M80,22 Q110,10 144,18 L144,62 Q110,54 80,66" {...line(c)} />
    <Path d="M80,22 V66" {...line(c)} opacity={0.55} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Path key={`l${i}`} d={`M24,${29 + i * 7} Q50,${20 + i * 7} 72,${32 + i * 7}`} {...line(c)} opacity={0.5} />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <Path key={`r${i}`} d={`M88,${32 + i * 7} Q110,${20 + i * 7} 136,${29 + i * 7}`} {...line(c)} opacity={i < 2 ? 0.5 : 0.2} />
    ))}
    <Circle cx={110} cy={39.3} r={4} fill={c} />
  </>
)

/** Running: strides as arcs between footfalls, growing surer, along a dashed track; the dot the next landing. */
const Running: Draw = (c) => {
  const falls = [10, 38, 66, 94, 122, 150]
  return (
    <>
      <Path d={`M0,64H${W}`} {...line(c)} strokeDasharray="3 3" opacity={0.35} />
      <Path d={trace((x) => 30 - 6 * Math.sin((x / W) * Math.PI))} {...line(c)} opacity={0.15} />
      {falls.slice(0, -1).map((x0, i) => (
        <Path key={x0} d={`M${x0},62 Q${x0 + 14},${46 - i * 3} ${falls[i + 1]},62`} {...line(c)} opacity={0.3 + i * 0.16} />
      ))}
      {falls.slice(0, -1).map((x) => (
        <Circle key={`f${x}`} cx={x} cy={62} r={1.6} fill={c} opacity={0.45} />
      ))}
      <Circle cx={150} cy={62} r={4} fill={c} />
    </>
  )
}

/** Swimming: stacked waves, faint to full, a dashed wake behind the swimmer (the dot) on the top one. */
const Swimming: Draw = (c) => {
  const wave = (i: number) => (x: number) => 30 + i * 12 + 3 * Math.sin(x / 8 + i * 0.9)
  return (
    <>
      {[3, 2, 1].map((i) => (
        <Path key={i} d={trace(wave(i))} {...line(c)} opacity={0.5 - i * 0.12} />
      ))}
      <Path d={trace(wave(0))} {...line(c)} />
      <Path d={span((x) => wave(0)(x) - 6, 40, 100)} {...line(c)} strokeDasharray="3 3" opacity={0.45} />
      <Circle cx={108} cy={wave(0)(108) - 6} r={4} fill={c} />
    </>
  )
}

/** Meditation: breath as rings settling outward around a still centre, a quiet horizon through it. */
const Meditation: Draw = (c) => (
  <>
    <Path d="M0,38H36 M124,38H160" {...line(c)} strokeDasharray="3 3" opacity={0.35} />
    {[34, 26, 18, 10].map((r, i) => (
      <Circle key={r} cx={80} cy={38} r={r} {...line(c)} opacity={0.18 + i * 0.22} />
    ))}
    <Circle cx={80} cy={38} r={4} fill={c} />
  </>
)

/** Gym: a barbell with stacked plates, its earlier positions fading below the lockout (the dot). */
const Gym: Draw = (c) => {
  const bar = (y: number, opacity: number, key: string) => (
    <Path key={key} d={`M18,${y}H142 M30,${y - 14}V${y + 14} M36,${y - 10}V${y + 10} M42,${y - 6}V${y + 6} M130,${y - 14}V${y + 14} M124,${y - 10}V${y + 10} M118,${y - 6}V${y + 6}`} {...line(c)} opacity={opacity} />
  )
  return (
    <>
      {bar(58, 0.2, 'a')}
      {bar(40, 0.4, 'b')}
      <Path d="M80,64V26" {...line(c)} strokeDasharray="3 3" opacity={0.4} />
      {bar(22, 1, 'c')}
      <Circle cx={80} cy={22} r={4} fill={c} />
    </>
  )
}

/** Journaling: ruled lines and a margin, a line and a half of handwriting, the dot the pen's tip. */
const Journaling: Draw = (c) => {
  const hand = (base: number) => (x: number) => base - 4 * Math.abs(Math.sin(x / 3.2)) - 1.5 * Math.sin(x / 1.7)
  return (
    <>
      {[18, 32, 46, 60, 74].map((y) => (
        <Path key={y} d={`M8,${y}H152`} {...line(c)} opacity={0.2} />
      ))}
      <Path d="M20,8V78" {...line(c)} strokeDasharray="3 3" opacity={0.35} />
      <Path d={span(hand(31), 26, 148, 2)} {...line(c)} />
      <Path d={span(hand(45), 26, 98, 2)} {...line(c)} />
      <Circle cx={98} cy={hand(45)(98)} r={4} fill={c} />
    </>
  )
}

/** Walking: a winding path climbing away, left and right footsteps along it, the dot where you're headed. */
const Walking: Draw = (c) => {
  const path = (x: number) => 70 - 0.32 * x - 8 * Math.sin(x / 16)
  const steps = Array.from({ length: 12 }, (_, i) => 10 + i * 12)
  return (
    <>
      <Path d={trace(path)} {...line(c)} opacity={0.3} />
      {steps.map((x, i) => {
        const y = path(x) + (i % 2 ? 4 : -4)
        return <Path key={x} d={`M${x - 2},${y}L${x + 3},${y - 1}`} {...line(c)} opacity={0.35 + (i / steps.length) * 0.65} />
      })}
      <Circle cx={152} cy={path(152)} r={4} fill={c} />
    </>
  )
}

/** Coding: angle brackets around indented lines of code, the cursor (the dot) at the end of the line being written. */
const Coding: Draw = (c) => {
  const rows: [number, number][] = [
    [50, 96],
    [58, 104],
    [66, 90],
    [58, 84],
    [50, 70],
  ]
  return (
    <>
      <Path d="M38,20 L20,40 L38,60" {...line(c)} />
      <Path d="M122,20 L140,40 L122,60" {...line(c)} />
      {rows.map(([x0, x1], i) => (
        <Path key={i} d={`M${x0},${24 + i * 8}H${x1}`} {...line(c)} opacity={i === 2 ? 0.9 : 0.35} />
      ))}
      <Circle cx={96} cy={40} r={4} fill={c} />
    </>
  )
}

/** Hydration: a glass with a rippled water line and faint fill, bubbles rising, a drop falling in (the dot). */
const Hydration: Draw = (c) => {
  const level = (x: number) => 36 + 1.5 * Math.sin(x / 4)
  return (
    <>
      <Path d="M52,14 L60,72 H100 L108,14" {...line(c)} />
      <Path d={span(level, 55, 105, 2)} {...line(c)} />
      {[46, 56, 66].map((y) => {
        const inset = 8 * ((y - 14) / 58)
        return <Path key={y} d={`M${52 + inset + 2},${y}H${108 - inset - 2}`} {...line(c)} opacity={0.2} />
      })}
      <Circle cx={70} cy={60} r={1.6} fill={c} opacity={0.4} />
      <Circle cx={86} cy={52} r={1.6} fill={c} opacity={0.4} />
      <Circle cx={76} cy={44} r={1.6} fill={c} opacity={0.4} />
      <Path d="M80,12V28" {...line(c)} strokeDasharray="3 3" opacity={0.4} />
      <Circle cx={80} cy={7} r={4} fill={c} />
    </>
  )
}

/** Sleep: a night's sleep stages as a step line, down to deep sleep and back, waking at the dot. */
const Sleep: Draw = (c) => {
  const stages: [number, number][] = [
    [0, 18],
    [14, 32],
    [28, 46],
    [40, 62],
    [62, 46],
    [74, 32],
    [86, 46],
    [100, 62],
    [116, 46],
    [128, 32],
    [142, 18],
  ]
  const d = stages.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `H${x}V${y}`)).join('') + 'H152'
  return (
    <>
      <Path d={`M0,62H${W}`} {...line(c)} strokeDasharray="3 3" opacity={0.3} />
      <Path d={`M0,18H${W}`} {...line(c)} strokeDasharray="2 4" opacity={0.2} />
      <Path d={d} {...line(c)} />
      {[
        [104, 8],
        [118, 12],
        [130, 6],
      ].map(([x, y]) => (
        <Circle key={x} cx={x} cy={y} r={1.4} fill={c} opacity={0.45} />
      ))}
      <Circle cx={152} cy={18} r={4} fill={c} />
    </>
  )
}

/** Any other habit: a 5×5 dot grid, each dot's shade from a hash of the id, the centre one large. */
function dotGrid(seed: string): Draw {
  return function DotGrid(c) {
    let h = 0x811c9dc5 // FNV-1a
    for (const ch of seed) {
      h ^= ch.charCodeAt(0)
      h = Math.imul(h, 0x01000193)
    }
    const dots: ReactNode[] = []
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = W / 2 + (col - 2) * 16
        const cy = H / 2 + (row - 2) * 14
        if (row === 2 && col === 2) {
          dots.push(<Circle key="c" cx={cx} cy={cy} r={6} fill={c} />)
          continue
        }
        h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
        dots.push(<Circle key={`${row}-${col}`} cx={cx} cy={cy} r={2.4} fill={c} opacity={0.2 + ((h >>> 0) % 5) * 0.15} />)
      }
    }
    return <>{dots}</>
  }
}

const DIAGRAMS: Record<string, Draw> = {
  reading: Reading,
  running: Running,
  swimming: Swimming,
  meditation: Meditation,
  gym: Gym,
  journaling: Journaling,
  walking: Walking,
  coding: Coding,
  water: Hydration,
  sleep: Sleep,
}

export function HabitDiagram({ id, color, width, height }: { id: string; color: string; width: number; height: number }) {
  const draw = DIAGRAMS[id] ?? dotGrid(id)
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      {draw(color)}
    </Svg>
  )
}
