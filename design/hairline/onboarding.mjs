#!/usr/bin/env node
/**
 * Onboarding figures in the Hairline style, drawn with the Hairline kernel. Each figure
 * is a function of time that acts out its step in a loop (ambient motion, rule 07), and
 * starts and ends on its composed rest pose (rule 05). Every frame is redrawn by the
 * kernel, so near plates keep hiding far ones (rule 06). Motion uses the kernel's own
 * 700ms ease (EASE_LIFT, rule 08), staggered by |i − a| × step (rule 03).
 *
 *   node design/hairline/onboarding.mjs <path/to/kernel.js>
 *
 * kernel.js is the Hairline skill's engine (npx skills add lucasmarkes/hairline).
 * Writes apps/mobile/src/features/tree/onboardingPaths.ts: the rest pose, plus only the
 * paths that move, as a few distinct poses and a timeline of which pose each frame shows.
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
const { Cam, fit, proj, facing, rings, prism, rrect, ringAt, run, hull, poly, open, circ, EASE_LIFT } = ctx.HL

const FPS = 20
const DUR = 700 // rule 08: a discrete change gets a 700ms ease-out

/** A value moved by tweens: [start ms, target] steps from `rest`, each a 700ms EASE_LIFT. */
function track(rest, steps) {
  return (ms) => {
    let v = rest
    for (const [t0, to] of steps) {
      if (ms < t0) break
      const from = v
      v = from + (to - from) * EASE_LIFT(Math.min(1, (ms - t0) / DUR))
    }
    return v
  }
}

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
    done: () => ({ paths: out, pts }),
  }
}

const disc = (x, y, r, n = 12) => rrect(x - r, y - r, x + r, y + r, r, n)
/** A round solid; large ones get more steps so the sides don't show (rule 09). */
const round = (P, front, x, y, r, b, z0, z1) => prism(P, front, disc(x, y, r), disc(x, y, r - b), z0, z1)
/** A solid whose top is smaller than its foot (rule 09's two strings). */
function taper(P, front, foot, top, inner, z0, z1) {
  return { sil: poly(hull(ringAt(P, foot, z0).concat(ringAt(P, top, z1)))), crease: open(ringAt(P, run(inner, front), z1)) }
}

/** A ball: the hull of its latitude rings for the silhouette, the equator's front run as the crease (rule 09). */
function ball(P, front, x, y, zc, r) {
  const pts = []
  for (let k = -6; k <= 6; k++) {
    const t = (k / 6) * (Math.PI / 2)
    const ring = circ(r * Math.cos(t), 24).map((q) => ({ ...q, u: q.u + x, v: q.v + y }))
    pts.push(...ringAt(P, ring, zc + r * Math.sin(t)))
  }
  const eq = circ(r, 48).map((q) => ({ ...q, u: q.u + x, v: q.v + y }))
  return { sil: poly(hull(pts)), crease: open(ringAt(P, run(eq, front), zc)) }
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
 * Snap: a camera lying on its back, lens up. The lens racks out to focus, the shutter
 * (the bright mark) presses and comes back, then the lens settles. Loop 2.8s.
 */
const snap = {
  loop: 2800,
  draw() {
    const { P, front } = camera(1.9, [[-46, -32, 0], [46, 32, 0], [46, -32, 0], [-46, 32, 0], [0, 0, 48]])
    const zoom = track(0, [[200, 5], [1700, 0]])
    const press = track(0, [[900, -3], [1500, 0]])
    return (ms) => {
      const c = canvas()
      const z = zoom(ms)
      const [body, bodyIn] = rings(-44, -30, 44, 30, 12, 1.8)
      c.solid(prism(P, front, body, bodyIn, 0, 20))
      const [hump, humpIn] = rings(-34, -28, -6, -14, 5, 1.2)
      c.solid(prism(P, front, hump, humpIn, 20, 27))
      c.solid(round(P, front, 30, -16, 6, 1.2, 20, 25 + press(ms)), true)
      c.solid(round(P, front, 2, 6, 21, 1.8, 20, 30))
      c.solid(round(P, front, 2, 6, 15, 1.6, 30, 38 + z))
      c.solid(round(P, front, 2, 6, 8, 1.4, 38 + z, 40 + z))
      return c.done()
    }
  },
}

/**
 * Streak: seven days as pillars that step up, today the tallest and bright. They sink,
 * then rise again one day at a time from the first. Loop 4.2s.
 */
const streak = {
  loop: 4200,
  draw() {
    const N = 7, step = 30, H = (i) => 10 + i * 9, LOW = 3
    const xs = Array.from({ length: N }, (_, i) => (i - (N - 1) / 2) * step)
    const { P, front } = camera(1.6, [[xs[0] - 10, -10, 0], [xs[N - 1] + 10, 10, 0], [xs[0] - 10, 10, 0], [xs[N - 1] + 10, -10, H(N - 1)]])
    const heights = xs.map((_, i) => track(H(i), [[1500, LOW], [2200 + i * 120, H(i)]]))
    return (ms) => {
      const c = canvas()
      xs.forEach((x, i) => {
        const [r, inn] = rings(x - 8, -8, x + 8, 8, 5, 1.4)
        c.solid(prism(P, front, r, inn, 0, heights[i](ms)), i === N - 1)
      })
      return c.done()
    }
  },
}

/**
 * Pod: a sapling on a shared mound, with four podmates' stools around it. A gust passes
 * through the leaves, from one side to the other, and they settle. The crest leaf is the
 * bright mark. Loop 3.6s.
 */
const pod = {
  loop: 3600,
  draw() {
    const TRUNK = 30, CROWN = 34
    const { P, front } = camera(1.75, [[-58, -58, -8], [58, 58, -8], [58, -58, -8], [-58, 58, -8], [0, 0, CROWN + 16]])
    const stools = [[-26, -14], [16, -28], [-14, 24], [26, 14]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
    const leaves = [
      [215, 16, -2, 11], [140, 15, 0, 10], [300, 15, -1, 10], [45, 16, 1, 11], [90, 6, 6, 10], [0, 4, 9, 10],
    ].map(([deg, reach, dz, len]) => {
      const a = (deg * Math.PI) / 180
      return { a, reach, z: CROWN + dz, len, x: Math.cos(a) * reach, y: Math.sin(a) * reach }
    }).sort((p, q) => (p.x + p.y) * 0.61 + p.z * 0.5 - ((q.x + q.y) * 0.61 + q.z * 0.5))
    const crest = leaves.reduce((p, q) => (q.z > p.z ? q : p))
    // The gust starts at the leaf farthest along x − y and spreads (rule 03).
    const order = leaves.map((l) => l.x - l.y)
    const a0 = Math.max(...order)
    const sway = leaves.map((l, i) => {
      const delay = Math.round((Math.abs(a0 - order[i]) / 40) * 260)
      return { turn: track(0, [[400 + delay, 0.32], [1300 + delay, 0]]), dip: track(0, [[400 + delay, -2], [1300 + delay, 0]]) }
    })
    return (ms) => {
      const c = canvas()
      const now = leaves.map((l, i) => {
        const a = l.a + sway[i].turn(ms), z = l.z + sway[i].dip(ms)
        const x = Math.cos(a) * l.reach, y = Math.sin(a) * l.reach
        return { ...l, x, y, z, ring: almond(x, y, l.len, l.len * 0.42, a), inner: almond(x, y, l.len - 2, l.len * 0.42 - 1.6, a) }
      })
      const drawStool = ([x, y]) => c.solid(round(P, front, x, y, 6, 1.2, 0, 7))
      c.solid(taper(P, front, disc(0, 0, 44, 14), disc(0, 0, 37, 14), disc(0, 0, 34.5, 14), -8, 0))
      stools.filter(([x, y]) => x + y < 0).forEach(drawStool)
      for (const l of now) c.line(open([P(0, 0, TRUNK - 4), P(l.x * 0.5, l.y * 0.5, (TRUNK + l.z) / 2 + 2), P(l.x * 0.8, l.y * 0.8, l.z)]))
      c.solid(taper(P, front, disc(0, 0, 5, 8), disc(0, 0, 3, 8), disc(0, 0, 2, 8), 0, TRUNK))
      now.forEach((l, i) => c.solid(prism(P, front, l.ring, l.inner, l.z, l.z + 1.2), leaves[i] === crest))
      stools.filter(([x, y]) => x + y >= 0).forEach(drawStool)
      return c.done()
    }
  },
}

/**
 * Habits: three tiles fanned on a stack, the top one bright. Each lifts in turn from the
 * bottom, like picking them up, and sets back down. Loop 3.6s.
 */
const habits = {
  loop: 3600,
  draw() {
    const { P, front } = camera(1.9, [[-48, -32, 0], [40, 36, 0], [40, -32, 0], [-48, 36, 0], [0, 0, 38]])
    const tiles = [[-22, -6, 0], [-4, 2, 12], [14, 10, 24]]
    const lift = tiles.map((_, i) => track(0, [[300 + i * 160, 5], [1200 + i * 160, 0]]))
    return (ms) => {
      const c = canvas()
      tiles.forEach(([dx, dy, z], i) => {
        const [r, inn] = rings(-24 + dx, -24 + dy, 24 + dx, 24 + dy, 9, 1.6)
        const zz = z + lift[i](ms)
        c.solid(prism(P, front, r, inn, zz, zz + 6), i === tiles.length - 1)
      })
      return c.done()
    }
  },
}

const r1 = (d) => d.replace(/-?\d+\.\d+/g, (m) => String(Math.round(+m * 10) / 10))

/** Draws every frame, keeps the rest pose whole and only the paths that change. */
function bake({ loop, draw }) {
  const at = draw()
  const n = Math.round((loop / 1000) * FPS)
  const frames = Array.from({ length: n }, (_, f) => at((f * 1000) / FPS))
  const pts = frames.flatMap((f) => f.pts)
  const pad = 4
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const x0 = Math.floor(Math.min(...xs) - pad), y0 = Math.floor(Math.min(...ys) - pad)
  const w = Math.ceil(Math.max(...xs) + pad) - x0, h = Math.ceil(Math.max(...ys) + pad) - y0
  const ds = frames.map((f) => f.paths.map(([, d]) => r1(d)))
  const rest = frames[0].paths.map(([k], i) => [k, ds[0][i]])
  const slots = rest.map((_, i) => i).filter((i) => ds.some((f) => f[i] !== ds[0][i]))
  const poses = []
  const seen = new Map()
  const timeline = ds.map((f) => {
    const pose = slots.map((i) => f[i])
    const key = pose.join('|')
    if (!seen.has(key)) {
      seen.set(key, poses.length)
      poses.push(pose)
    }
    return seen.get(key)
  })
  return { viewBox: `${x0} ${y0} ${w} ${h}`, aspect: +(w / h).toFixed(4), paths: rest, anim: { fps: FPS, slots, poses, timeline } }
}

/**
 * Peapod (sign-in): an open pea pod lying on the ground, three peas in it. The peas lift
 * one after another, like they're popping up, and settle; the middle pea is bright. Loop 3.6s.
 */
const peapod = {
  loop: 3600,
  draw() {
    const A = -2.0 // the pod's direction on the ground: a rising diagonal on screen, like the reference logo
    const L = 40, W = 14, H = 11
    const { P, front } = camera(2.1, [[-44, -44, 0], [44, 44, 0], [44, -44, 0], [-44, 44, 0], [0, 0, 30]])
    const axis = (d) => [Math.cos(A) * d, Math.sin(A) * d]
    const peas = [-17, 0, 17].map((d) => axis(d))
    const lift = peas.map((_, i) => track(0, [[300 + i * 160, 7], [1200 + i * 160, 0]]))
    const foot = almond(0, 0, L * 0.78, W * 0.45, A), rim = almond(0, 0, L, W, A), lip = almond(0, 0, L - 2.5, W - 2.5, A)
    return (ms) => {
      const c = canvas()
      // The shell: a boat, narrower at the keel than at the rim; its rim is the crease.
      c.solid(taper(P, front, foot, rim, lip, 0, H))
      // The stem curls up from the far tip.
      const [tx, ty] = axis(L + 1)
      const [nx, ny] = axis(L + 6)
      c.line(open([P(tx, ty, H - 2), P(nx, ny, H + 4), P(nx - 2, ny - 2, H + 10)]))
      // Peas, far to near along x + y so nearer ones cover farther ones (rule 06).
      peas
        .map((p, i) => ({ p, i }))
        .sort((a, b) => a.p[0] + a.p[1] - (b.p[0] + b.p[1]))
        .forEach(({ p: [x, y], i }) => c.solid(ball(P, front, x, y, H + 1 + lift[i](ms), 7), i === 1))
      // The near wall of the shell comes last, so the peas sit inside the pod, not on it.
      const wall = poly(hull(ringAt(P, run(foot, front), 0).concat(ringAt(P, run(rim, front), H))))
      c.solid({ sil: wall, crease: open(ringAt(P, run(lip, front), H)) })
      return c.done()
    }
  },
}

const figures = { snap: bake(snap), streak: bake(streak), pod: bake(pod), habits: bake(habits), peapod: bake(peapod) }
const q = (s) => `'${s}'`
const lines = Object.entries(figures).map(([name, f]) => {
  const paths = f.paths.map(([k, d]) => `      ['${k}', ${q(d)}],`).join('\n')
  const poses = f.anim.poses.map((p) => `        [${p.map(q).join(', ')}],`).join('\n')
  return `  ${name}: {
    viewBox: '${f.viewBox}',
    aspect: ${f.aspect},
    paths: [
${paths}
    ],
    anim: {
      fps: ${f.anim.fps},
      slots: [${f.anim.slots.join(', ')}],
      timeline: [${f.anim.timeline.join(', ')}],
      poses: [
${poses}
      ],
    },
  },`
})
const out = `/**
 * Onboarding figures in the Hairline style, drawn with the Hairline kernel by
 * design/hairline/onboarding.mjs. Regenerate with the script, not by hand.
 * \`paths\` is the rest pose, painted back to front; plates are filled with the ground
 * colour so nearer ones hide farther ones. \`anim\` loops the figure: \`slots\` are the
 * paths that move, \`poses\` their shapes, \`timeline\` the pose for each frame.
 *   sil  silhouette (filled plate)   lo  dim crease   limb  open line   hi  the bright mark
 */
import type { HairlineDrawing } from './GroveFigure'

export const ONBOARDING_FIGURES: Record<'snap' | 'streak' | 'pod' | 'habits' | 'peapod', HairlineDrawing> = {
${lines.join('\n')}
}
`
const dest = fileURLToPath(new URL('../../apps/mobile/src/features/tree/onboardingPaths.ts', import.meta.url))
writeFileSync(dest, out)
for (const [name, f] of Object.entries(figures)) console.log(name, `${f.anim.slots.length} moving paths, ${f.anim.poses.length} poses, ${f.anim.timeline.length} frames`)
console.log(dest, `${Math.round(out.length / 1024)} KB`)
