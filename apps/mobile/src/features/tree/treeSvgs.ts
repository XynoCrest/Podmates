/**
 * The five tree illustrations (seed → full) and their grey "resting" twins, as SVG source.
 * Same geometry and colours as the design files tree-<n>-<stage>[-resting].svg: a trunk,
 * branches, and leaves fanned around each branch tip. Built from that geometry here so the
 * ten drawings stay in one readable table instead of ten long strings.
 */

const LEAF = 'M0 0C.24-.34.68-.36 1 0C.7.2.27.21 0 0Z'
const GROUND = '<ellipse cx="200" cy="368" rx="120" ry="9" fill="#E7ECE9"/>'

const LIVE = { wood: '#24372C', leaves: ['#16A34A', '#0B4A2B', '#7CCB2B'] }
const REST = { wood: '#7E8B84', leaves: ['#A3B0A8', '#7E8B84', '#A3B0A8'] }
const FRUIT = '#E8A13A'

type Pt = readonly [number, number]

const stroke = (d: string, width: number, color: string) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
const leaf = (fill: string, [x, y]: Pt, rotate: number, scale: number) =>
  `<path d="${LEAF}" fill="${fill}" transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})"/>`
const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${GROUND}${body}</svg>`

/** A branching tree: trunk to `top`, a branch to each tip, leaves fanned at every tip (and the top). */
function branching(o: { top: number; trunk: number; branches: [Pt, Pt][]; tips: Pt[]; angles: { live: number[]; rest: number[] }; scale: number; fruit?: Pt[] }, resting: boolean) {
  const palette = resting ? REST : LIVE
  const angles = resting ? o.angles.rest : o.angles.live
  let body = stroke(`M200 366 L200 ${o.top}`, o.trunk, palette.wood)
  for (const [[x1, y1], [x2, y2]] of o.branches) body += stroke(`M${x1} ${y1} L${x2} ${y2}`, o.trunk * 0.55, palette.wood)
  let i = 0
  for (const tip of o.tips) for (const a of angles) body += leaf(palette.leaves[i++ % 3]!, tip, a, o.scale)
  if (!resting) for (const [x, y] of o.fruit ?? []) body += `<circle cx="${x}" cy="${y}" r="9" fill="${FRUIT}"/>`
  return wrap(body)
}

const seed = (resting: boolean) => wrap(leaf(resting ? REST.wood : LIVE.leaves[1]!, [160, 354], -18, 90))

const sprout = (resting: boolean) =>
  wrap(
    stroke('M200 366 L200 300', 8, resting ? REST.wood : LIVE.wood) +
      (resting
        ? leaf(REST.leaves[0]!, [200, 304], -115, 80) + leaf(REST.leaves[0]!, [200, 300], 5, 80)
        : leaf(LIVE.leaves[0]!, [200, 304], -150, 80) + leaf(LIVE.leaves[2]!, [200, 300], -30, 80)),
  )

const sapling = (resting: boolean) =>
  branching(
    {
      top: 230,
      trunk: 12,
      branches: [
        [[200, 280], [150, 240]],
        [[200, 250], [250, 215]],
      ],
      tips: [[150, 240], [250, 215], [200, 230]],
      angles: { live: [-160, -90, -20], rest: [-125, -55, 15] },
      scale: 72,
    },
    resting,
  )

const young = (resting: boolean) =>
  branching(
    {
      top: 170,
      trunk: 18,
      branches: [
        [[200, 290], [130, 240]],
        [[200, 250], [270, 200]],
        [[200, 215], [145, 165]],
        [[200, 190], [240, 140]],
      ],
      tips: [[130, 240], [270, 200], [145, 165], [240, 140], [200, 170]],
      // Four leaves spread evenly over 140°, as in the design files.
      angles: { live: [0, 1, 2, 3].map((k) => -160 + (k * 140) / 3), rest: [0, 1, 2, 3].map((k) => -125 + (k * 140) / 3) },
      scale: 74,
    },
    resting,
  )

const full = (resting: boolean) =>
  branching(
    {
      top: 120,
      trunk: 24,
      branches: [
        [[200, 300], [110, 250]],
        [[200, 270], [295, 225]],
        [[200, 230], [120, 165]],
        [[200, 205], [280, 150]],
        [[200, 165], [160, 100]],
        [[200, 150], [245, 90]],
      ],
      tips: [[110, 250], [295, 225], [120, 165], [280, 150], [160, 100], [245, 90], [200, 120]],
      angles: { live: [-160, -125, -90, -55, -20], rest: [-125, -90, -55, -20, 15] },
      scale: 76,
      fruit: [[114, 244], [124, 159], [164, 94], [204, 114]],
    },
    resting,
  )

const DRAW = [seed, sprout, sapling, young, full]

/** Drawings for engine stage levels 1–6. Grown tree (5) and Ancient tree (6) share the full tree. */
export const TREE_SVGS = {
  live: DRAW.map((d) => d(false)),
  resting: DRAW.map((d) => d(true)),
}

export function treeSvg(level: number, resting: boolean) {
  const index = Math.min(Math.max(level, 1), DRAW.length) - 1
  return (resting ? TREE_SVGS.resting : TREE_SVGS.live)[index]!
}
