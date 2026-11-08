#!/usr/bin/env node
/**
 * Onboarding figures in the Hairline style, drawn with the Hairline kernel and
 * exported as rest poses, the way grovePaths.ts was. Static: the app shows them
 * still, so only the drawing rules apply (04 accent, 05 rest, 06 honesty,
 * 09 radius, 10 quiet, and the frame); the pointer rules have nothing to act on.
 *
 *   node design/hairline/onboarding.mjs <path/to/kernel.js>
 *
 * kernel.js is the Hairline skill's engine (npx skills add lucasmarkes/hairline).
 * Writes apps/mobile/src/features/tree/onboardingPaths.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const kernelPath = process.argv[2]
if (!kernelPath) {
  console.error('usage: node design/hairline/onboarding.mjs <kernel.js>')
  process.exit(2)
}
const ctx = {}
vm.createContext(ctx)
vm.runInContext(readFileSync(kernelPath, 'utf8') + '\n;globalThis.HL = HL', ctx)
const { Cam, fit, proj, facing, rings, prism, rrect, ringAt, run, hull, poly, open } = ctx.HL

/** Collects paths back to front, and the screen points they cover (for the viewBox). */
function canvas() {
  const out = []
  const pts = []
  const nums = (d) => {
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number)
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]])
  }
  return {
    solid(paths, bright = false) {
      out.push([bright ? 'hi' : 'sil', paths.sil])
      out.push(['lo', paths.crease])
      nums(paths.sil)
    },
    line(d) {
      out.push(['limb', d])
      nums(d)
    },
    done() {
      const pad = 4
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
      const x0 = Math.floor(Math.min(...xs) - pad), y0 = Math.floor(Math.min(...ys) - pad)
      const w = Math.ceil(Math.max(...xs) + pad) - x0, h = Math.ceil(Math.max(...ys) + pad) - y0
      return { viewBox: `${x0} ${y0} ${w} ${h}`, aspect: +(w / h).toFixed(4), paths: out }
    },
  }
}

const disc = (x, y, r, n = 12) => rrect(x - r, y - r, x + r, y + r, r, n)
/** A round solid; large ones get more steps so the sides don't show (rule 09). */
const round = (P, front, x, y, r, b, z0, z1) => prism(P, front, disc(x, y, r), disc(x, y, r - b), z0, z1)
/** A solid whose top is smaller than its foot (rule 09's two strings). */
function taper(P, front, foot, top, inner, z0, z1) {
  return { sil: poly(hull(ringAt(P, foot, z0).concat(ringAt(P, top, z1)))), crease: open(ringAt(P, run(inner, front), z1)) }
}

/** An almond leaf ring, as grove.js draws them. */
function almond(cx, cy, L, W, a, n = 10) {
  const pts = []
  for (let k = 0; k < 2 * n; k++) {
    const t = (k / (2 * n)) * Math.PI * 2
    pts.push([L * Math.cos(t), W * Math.sin(t) * Math.pow(Math.abs(Math.sin(t)), 0.35)])
  }
  const ca = Math.cos(a), sa = Math.sin(a)
  return pts.map(([x, y], k) => {
    const [px, py] = pts[(k + pts.length - 1) % pts.length], [nx, ny] = pts[(k + 1) % pts.length]
    const tu = nx - px, tv = ny - py, l = Math.hypot(tu, tv) || 1
    const nu0 = tv / l, nv0 = -tu / l
    return { u: cx + x * ca - y * sa, v: cy + x * sa + y * ca, nu: nu0 * ca - nv0 * sa, nv: nu0 * sa + nv0 * ca }
  })
}

function camera(S, extremes) {
  const C = Cam(45, 0.5, S)
  fit(C, extremes, 200, 166)
  return { C, P: proj(C), front: facing(C) }
}

/**
 * Snap: a camera lying on its back, lens up. Body, a viewfinder hump behind the lens,
 * a lens barrel in two steps, a shutter button. The shutter is the bright mark: the snap.
 */
function snap() {
  const { P, front } = camera(1.9, [[-46, -32, 0], [46, 32, 0], [46, -32, 0], [-46, 32, 0], [0, 0, 44]])
  const c = canvas()
  const [body, bodyIn] = rings(-44, -30, 44, 30, 12, 1.8)
  c.solid(prism(P, front, body, bodyIn, 0, 20))
  // Back to front by x + y: hump (far), shutter (far right), then the lens.
  const [hump, humpIn] = rings(-34, -28, -6, -14, 5, 1.2)
  c.solid(prism(P, front, hump, humpIn, 20, 27))
  c.solid(round(P, front, 30, -16, 6, 1.2, 20, 25), true)
  c.solid(round(P, front, 2, 6, 21, 1.8, 20, 30))
  c.solid(round(P, front, 2, 6, 15, 1.6, 30, 38))
  c.solid(round(P, front, 2, 6, 8, 1.4, 38, 40))
  return c.done()
}

/**
 * Streak: seven days as pillars that step up, the last one (today) the tallest
 * and bright. Rest is a rise, not a flat row (rule 05).
 */
function streak() {
  const N = 7, step = 30, H = (i) => 10 + i * 9
  const xs = Array.from({ length: N }, (_, i) => (i - (N - 1) / 2) * step)
  const { P, front } = camera(1.6, [[xs[0] - 10, -10, 0], [xs[N - 1] + 10, 10, 0], [xs[0] - 10, 10, 0], [xs[N - 1] + 10, -10, H(N - 1)]])
  const c = canvas()
  // Ascending x + y: far end first.
  xs.forEach((x, i) => {
    const [r, inn] = rings(x - 8, -8, x + 8, 8, 5, 1.4)
    c.solid(prism(P, front, r, inn, 0, H(i)), i === N - 1)
  })
  return c.done()
}

/**
 * Pod: a sapling on a shared mound, with four podmates' stools around it. Its crest
 * leaf is the bright mark: the tree they grow together.
 */
function pod() {
  const TRUNK = 30, CROWN = 34
  const { P, front } = camera(1.75, [[-58, -58, -8], [58, 58, -8], [58, -58, -8], [-58, 58, -8], [0, 0, CROWN + 16]])
  const c = canvas()
  c.solid(taper(P, front, disc(0, 0, 44, 14), disc(0, 0, 37, 14), disc(0, 0, 34.5, 14), -8, 0))
  const stools = [[-26, -14], [16, -28], [-14, 24], [26, 14]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
  const leaves = [
    [215, 16, -2, 11], [140, 15, 0, 10], [300, 15, -1, 10], [45, 16, 1, 11], [90, 6, 6, 10], [0, 4, 9, 10],
  ].map(([deg, reach, dz, len]) => {
    const a = (deg * Math.PI) / 180, x = Math.cos(a) * reach, y = Math.sin(a) * reach
    return { x, y, z: CROWN + dz, ring: almond(x, y, len, len * 0.42, a), inner: almond(x, y, len - 2, len * 0.42 - 1.6, a) }
  }).sort((p, q) => (p.x + p.y) * 0.61 + p.z * 0.5 - ((q.x + q.y) * 0.61 + q.z * 0.5))
  const crest = leaves.reduce((p, q) => (q.z > p.z ? q : p))
  const drawStool = ([x, y]) => c.solid(round(P, front, x, y, 6, 1.2, 0, 7))
  // Stools behind the trunk, the sapling, then the stools in front of it.
  stools.filter(([x, y]) => x + y < 0).forEach(drawStool)
  for (const l of leaves) c.line(open([P(0, 0, TRUNK - 4), P(l.x * 0.5, l.y * 0.5, (TRUNK + l.z) / 2 + 2), P(l.x * 0.8, l.y * 0.8, l.z)]))
  c.solid(taper(P, front, disc(0, 0, 5, 8), disc(0, 0, 3, 8), disc(0, 0, 2, 8), 0, TRUNK))
  for (const l of leaves) c.solid(prism(P, front, l.ring, l.inner, l.z, l.z + 1.2), l === crest)
  stools.filter(([x, y]) => x + y >= 0).forEach(drawStool)
  return c.done()
}

/**
 * Habits: three tiles fanned on a stack, the top one bright: the habits you pick.
 */
function habits() {
  const { P, front } = camera(1.9, [[-48, -32, 0], [40, 36, 0], [40, -32, 0], [-48, 36, 0], [0, 0, 32]])
  const c = canvas()
  const tiles = [[-22, -6, 0], [-4, 2, 12], [14, 10, 24]]
  tiles.forEach(([dx, dy, z], i) => {
    const [r, inn] = rings(-24 + dx, -24 + dy, 24 + dx, 24 + dy, 9, 1.6)
    c.solid(prism(P, front, r, inn, z, z + 6), i === tiles.length - 1)
  })
  return c.done()
}

const figures = { snap: snap(), streak: streak(), pod: pod(), habits: habits() }
const r = (n) => Math.round(n * 100) / 100
const lines = Object.entries(figures).map(([name, f]) => {
  const paths = f.paths.map(([k, d]) => `    ['${k}', '${d.replace(/-?\d+\.\d+/g, (m) => String(r(+m)))}'],`).join('\n')
  return `  ${name}: {\n    viewBox: '${f.viewBox}',\n    aspect: ${f.aspect},\n    paths: [\n${paths}\n    ],\n  },`
})
const out = `/**
 * Onboarding figures in the Hairline style: rest poses drawn with the Hairline kernel by
 * design/hairline/onboarding.mjs. Painted back to front; plates are filled with the
 * ground colour so nearer ones hide farther ones. Regenerate with the script, not by hand.
 *   sil  silhouette (filled plate)   lo  dim crease   limb  open line   hi  the bright mark
 */
import type { HairlineDrawing } from './GroveFigure'

export const ONBOARDING_FIGURES: Record<'snap' | 'streak' | 'pod' | 'habits', HairlineDrawing> = {
${lines.join('\n')}
}
`
const dest = fileURLToPath(new URL('../../apps/mobile/src/features/tree/onboardingPaths.ts', import.meta.url))
writeFileSync(dest, out)
console.log(dest)
