/**
 * Podmates design tokens. Light, from the app-screens PDF: an off-white canvas, white sheets,
 * soft grey controls and one green brand colour, so snaps and the tree carry the colour.
 *
 * Colour is reserved for meaning, so each reads at a glance:
 *   leaf   → brand, the tree, health, "done today"   energy → ⚡ energy points
 *   star   → ⭐ stars (perfect pod days)              flame  → 🔥 streaks, open snap window, "not yet" warnings
 *   danger → dead tree, destructive actions           sky    → downvotes
 * Each has a soft tint for backgrounds and a deep tone for text on that tint.
 * `leaf.bright` is the lighter green for rings, dots and the health bar.
 *
 * CommonJS on purpose: Metro and Node scripts can both require() it. `preset` is a Tailwind preset
 * kept for a future web console; the app uses the raw values.
 */
const colors = {
  canvas: '#F9FAFB',
  surface: '#FFFFFF',
  raised: '#F1F3F5',
  sunken: '#E9EDF0',
  line: '#E5E7EB',
  /** Input and outlined-button borders. */
  lineStrong: '#9AA1A9',
  ink: { DEFAULT: '#16181B', muted: '#5F6670', subtle: '#8A9099', inverse: '#FFFFFF' },
  leaf: { DEFAULT: '#15803D', soft: '#EBF6EE', deep: '#0F6B32', bright: '#16A34A' },
  energy: { DEFAULT: '#C2700F', soft: '#FDF1E3', deep: '#8A5A12' },
  star: { DEFAULT: '#B7791F', soft: '#FBF3E2', deep: '#7C5410' },
  flame: { DEFAULT: '#C2570C', soft: '#FDF1E3', deep: '#8A5A12' },
  danger: { DEFAULT: '#DC2626', soft: '#FDECEC', deep: '#B91C1C' },
  sky: { DEFAULT: '#2563EB', soft: '#EAF1FE', deep: '#1D4ED8' },
}

/** Story ring: solid green = new snaps to watch. */
const ring = [colors.leaf.bright, colors.leaf.bright, colors.leaf.bright]

/** Avatar initials colour, picked by profiles.avatar_color (also the swatches in Edit profile). */
const avatar = {
  leaf: '#15803D',
  sky: '#2563EB',
  star: '#7C5CD6',
  flame: '#C2570C',
  rose: '#BE3A6A',
  teal: '#0F8A84',
}

/** Avatar background tint for each avatar colour. */
const avatarSoft = {
  leaf: '#EBF6EE',
  sky: '#EAF1FE',
  star: '#F1EDFC',
  flame: '#FDF1E3',
  rose: '#FCEBF1',
  teal: '#E6F6F5',
}

const radii = { card: 16, control: 14, chip: 999, snap: 12 }

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

module.exports = { colors, ring, avatar, avatarSoft, radii, preset }
