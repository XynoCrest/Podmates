/**
 * Podmates design tokens. Dark-first: every reference surface (chat list, camera,
 * profile, feed, tree) reads best on a near-black canvas, and snaps pop on it.
 *
 * Colour is reserved for the game's three currencies and the tree, so each reads at a glance:
 *   leaf   → the tree, health, "done today"       energy → ⚡ energy points
 *   star   → ⭐ stars (perfect pod days)           flame  → 🔥 streaks, open snap window
 *   danger → wilting tree, destructive actions
 * Each has a soft tint for backgrounds and a deep tone for pressed/edge states.
 *
 * CommonJS on purpose: Metro and Node scripts can both require() it. `preset` is a Tailwind preset
 * kept for a future web console; the app uses the raw values.
 */
const colors = {
  canvas: '#0B0C0F',
  surface: '#15171C',
  raised: '#1E2128',
  sunken: '#08090B',
  line: '#2A2E37',
  ink: { DEFAULT: '#F3F4F6', muted: '#A3A8B4', subtle: '#6C7280', inverse: '#0B0C0F' },
  leaf: { DEFAULT: '#7BD64B', soft: '#16271A', deep: '#4E9A2C' },
  energy: { DEFAULT: '#FFC83D', soft: '#2B2412', deep: '#C9951C' },
  star: { DEFAULT: '#B9A2FF', soft: '#211C33', deep: '#8668E6' },
  flame: { DEFAULT: '#FF8A3D', soft: '#2E1C12', deep: '#D9651C' },
  danger: { DEFAULT: '#FF5D63', soft: '#2E1416', deep: '#C93B41' },
  sky: { DEFAULT: '#5AB2FF', soft: '#122233', deep: '#2F86D6' },
}

/** Story ring gradient (unseen snaps). */
const ring = ['#FFC83D', '#FF8A3D', '#F0457D']

/** Avatar backgrounds, picked by profiles.avatar_color. */
const avatar = {
  leaf: '#3F8F2A',
  sky: '#2F6FB0',
  star: '#6A4FC9',
  flame: '#C2581C',
  rose: '#B23A63',
  teal: '#1F8A84',
}

const radii = { card: 20, control: 14, chip: 999, snap: 6 }

/** Tailwind preset for a future web console. */
const preset = {
  theme: {
    extend: {
      colors,
      borderRadius: { card: `${radii.card}px`, control: `${radii.control}px`, snap: `${radii.snap}px` },
      letterSpacing: { tightest: '-0.04em' },
    },
  },
}

module.exports = { colors, ring, avatar, radii, preset }
