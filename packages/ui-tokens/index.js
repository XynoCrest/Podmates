/**
 * Podmates design tokens. Dark-first: chat, camera, profile, feed, and tree
 * surfaces use an evergreen charcoal canvas, with snaps kept prominent.
 *
 * A quiet evergreen base keeps the app grounded. Colour is reserved for the game's currencies
 * and the tree, so each reads at a glance:
 *   leaf   → the tree, health, "done today"       energy → ⚡ energy points
 *   star   → ⭐ stars (perfect pod days)           flame  → 🔥 streaks, open snap window
 *   danger → wilting tree, destructive actions
 * Each has a soft tint for backgrounds and a deep tone for pressed/edge states.
 *
 * CommonJS on purpose: Metro and Node scripts can both require() it. `preset` is a Tailwind preset
 * kept for a future web console; the app uses the raw values.
 */
const colors = {
  canvas: '#111813',
  surface: '#1A231C',
  raised: '#242F26',
  sunken: '#0D130F',
  line: '#303C32',
  ink: { DEFAULT: '#F0F1E9', muted: '#B0B9AE', subtle: '#7E8A7F', inverse: '#111813' },
  leaf: { DEFAULT: '#A1BD8A', soft: '#29372B', deep: '#789666' },
  energy: { DEFAULT: '#E4C77C', soft: '#373321', deep: '#B99C53' },
  star: { DEFAULT: '#C0B4D7', soft: '#332D3E', deep: '#9787B4' },
  flame: { DEFAULT: '#D99875', soft: '#3B2D25', deep: '#B67554' },
  danger: { DEFAULT: '#D98280', soft: '#3A2928', deep: '#B66563' },
  sky: { DEFAULT: '#9AB9C4', soft: '#29363A', deep: '#7295A1' },
}

/** Story ring gradient (unseen snaps). */
const ring = ['#E4C77C', '#D99875', '#AE7C8E']

/** Avatar backgrounds, picked by profiles.avatar_color. */
const avatar = {
  leaf: '#526D50',
  sky: '#526F78',
  star: '#70627F',
  flame: '#93664F',
  rose: '#8E5C63',
  teal: '#4C7770',
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
