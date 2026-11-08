/**
 * Grove: a tree on a grassy mound. A tapered trunk forks into limbs, each
 * holding an almond leaf that lies flat in the crown. The pointer is a breeze:
 * projected onto the crown's plane, it lifts the leaves near it on their own
 * springs, falling off with distance. At rest the crown is a dome with its
 * crest leaf bright. The slider is the breeze's radius, in world units.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, prism, ringAt, rrect, run, rings, unproj,
  spring, stepS, mk, pointer, put, register, disposer, solid,
} = HL;

const CROWN = 64, LIFT = 16, TRUNK = 50;

/** An almond leaf as a ring of samples: two arcs meeting in points, turned to angle a, centred at (cx, cy). */
function almond(cx, cy, L, W, a, n = 10) {
  const pts = [];
  for (let k = 0; k < 2 * n; k++) {
    const t = (k / (2 * n)) * Math.PI * 2;
    const x = L * Math.cos(t), y = W * Math.sin(t) * Math.pow(Math.abs(Math.sin(t)), 0.35);
    pts.push([x, y]);
  }
  const ca = Math.cos(a), sa = Math.sin(a);
  return pts.map(([x, y], k) => {
    const [px, py] = pts[(k + pts.length - 1) % pts.length], [nx, ny] = pts[(k + 1) % pts.length];
    let tu = nx - px, tv = ny - py, l = Math.hypot(tu, tv) || 1;
    const nu0 = tv / l, nv0 = -tu / l;
    return { u: cx + x * ca - y * sa, v: cy + x * sa + y * ca, nu: nu0 * ca - nv0 * sa, nv: nu0 * sa + nv0 * ca };
  });
}

/** A solid whose top is smaller than its foot: rule 09's two strings. */
function taper(P, front, foot, top, inner, z0, z1) {
  return { sil: poly(hull(ringAt(P, foot, z0).concat(ringAt(P, top, z1)))), crease: open(ringAt(P, run(inner, front), z1)) };
}
const disc = (x, y, r, n = 10) => rrect(x - r, y - r, x + r, y + r, r, n);

const falloff = (u) => (u <= 0 ? 1 : u <= 0.42 ? 1 - (u / 0.42) * 0.69 : u <= 1 ? 0.31 - ((u - 0.42) / 0.58) * 0.22 : 0.09);

// The crown: [angle°, reach, height above CROWN, length]. A dome, heavier on the left.
const LEAVES = [
  [225, 44, -12, 17], [190, 40, -8, 16], [265, 40, -10, 16], [150, 42, -14, 16], [305, 44, -16, 16],
  [30, 42, -14, 17], [75, 44, -18, 16], [110, 40, -16, 16], [345, 34, -6, 15], [235, 26, 4, 15],
  [180, 22, 6, 14], [290, 22, 4, 14], [50, 26, 0, 14], [120, 22, 2, 14], [0, 18, 8, 14],
  [210, 8, 16, 14], [80, 8, 14, 13], [330, 6, 18, 14],
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.7);
  fit(C, [[-60, -60, -8], [60, 60, -8], [60, -60, -8], [-60, 60, -8], [0, 0, CROWN + 20 + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value, over = null, pick = null;
  const g = mk("g", {}, svg);

  // The mound and two bushes at the trunk's foot, back to front.
  put(solid(g), taper(P, front, disc(0, 0, 50, 14), disc(0, 0, 42, 14), disc(0, 0, 39, 14), -10, 0));
  for (const [x, y, r, h] of [[-30, 4, 7, 6], [-24, 16, 5, 4], [22, -28, 6, 5]]) {
    const [br, bi] = rings(x - r, y - r, x + r, y + r, r, 1.6);
    put(solid(g), prism(P, front, br, bi, 0, h));
  }

  // Leaves sorted by screen depth: farther and lower first.
  const leaves = LEAVES.map(([deg, reach, dz, len], i) => {
    const a = (deg * Math.PI) / 180, x = Math.cos(a) * reach, y = Math.sin(a) * reach, z0 = CROWN + dz;
    return { i, x, y, z0, ring: almond(x, y, len, len * 0.42, a), inner: almond(x, y, len - 2.4, len * 0.42 - 2, a),
      fork: TRUNK - 4 + (reach < 30 ? 6 : 0), sp: spring(z0, { eps: 0.04 }), drawn: NaN };
  }).sort((p, q) => (p.x + p.y) * 0.61 + p.z0 * 0.5 - ((q.x + q.y) * 0.61 + q.z0 * 0.5));
  const crest = leaves.reduce((p, q) => (q.z0 > p.z0 ? q : p));

  // Limbs behind every leaf, then the trunk, then the leaves: the trunk covers far limbs' roots.
  const limbs = mk("g", {}, g);
  for (const l of leaves) l.limb = mk("path", { class: "sil nf" }, limbs);
  put(solid(g), taper(P, front, disc(0, 0, 9, 8), disc(0, 0, 5, 8), disc(0, 0, 3.6, 8), 0, TRUNK + 4));
  for (const l of leaves) l.el = solid(g);

  function draw(l) {
    const z = l.sp.x;
    if (z === l.drawn) return;
    l.drawn = z;
    const k = 0.55, mx = l.x * k, my = l.y * k;
    l.limb.setAttribute("d", open([P(0, 0, l.fork), P(mx, my, (l.fork + z) / 2 + 4), P(l.x * 0.8, l.y * 0.8, z)]));
    put(l.el, prism(P, front, l.ring, l.inner, z, z + 1.4));
    const on = l === (pick || crest);
    l.el.sil.classList.toggle("hi", on);
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const l of leaves) { if (stepS(l.sp, dt)) m = true; draw(l); }
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    let near = null, best = Infinity;
    for (const l of leaves) {
      if (!over) { l.sp.t = l.z0; l.drawn = NaN; continue; }
      const d = Math.hypot(l.x - over[0], l.y - over[1]);
      l.sp.t = l.z0 + LIFT * falloff(d / R);
      l.drawn = NaN;
      if (d < best) { best = d; near = l; }
    }
    pick = near && best < R ? near : null;
    read.textContent = near && best < R ? `leaf ${String(near.i + 1).padStart(2, "0")}` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { const w = unproj(C, p[0], p[1], CROWN); over = [clamp(w[0], -80, 80), clamp(w[1], -80, 80)]; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { R = v; if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "grove",
  means: "A tree's almond leaves lift on their limbs where the breeze of the pointer passes, falling off with distance.",
  rules: [1, 3, 5, 9],
  range: [18, 30, 48],
  tour: [[150, 120], [250, 110], [200, 80], null],
  mount,
});
