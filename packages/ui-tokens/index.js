/**
 * Podmates design tokens. Dark-first: every reference surface (chat list, camera,
 * profile, feed, tree) reads best on a near-black canvas, and snaps pop on it.
 *
 * Colour is reserved for the game's three currencies and the tree, so each reads at a glance:
 *   leaf   → the brand green: heroes, the tree, health, "done today"
 *   energy → on-time badges, warnings              flame  → 🔥 streaks, open snap window
 *   star   → reserved                              sky    → your own chat bubbles, links
 *   danger → wilting tree, destructive actions
 * Each has a soft tint for backgrounds and a deep tone for pressed/edge states.
 *
 * CommonJS on purpose: Metro and Node scripts can both require() it. `preset` is a Tailwind preset
 * kept for a future web console; the app uses the raw values.
 */
/** The brand green (#00AB5A): heroes, the tree, health, "done today", primary accents. */
const BRAND = '#00AB5A'

const colors = {
  canvas: '#0B0C0F',
  surface: '#15171C',
  raised: '#1E2128',
  sunken: '#08090B',
  line: '#2A2E37',
  ink: { DEFAULT: '#F3F4F6', muted: '#A3A8B4', subtle: '#6C7280', inverse: '#0B0C0F' },
  leaf: { DEFAULT: BRAND, soft: '#0B2618', deep: '#00813F' },
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

/**
 * The hero band at the top of tab pages (Home, Explore): brand green with dark ink, and
 * white for the bright half of the heading.
 */
const hero = { bg: BRAND, ink: '#03200F', soft: 'rgba(3, 32, 15, 0.72)', faint: 'rgba(3, 32, 15, 0.25)', bright: '#FFFFFF' }

/** Over photos and the camera: black ground, white ink, translucent discs and pills. */
const overlay = { media: '#000000', ink: '#FFFFFF', scrim: 'rgba(0, 0, 0, 0.5)', scrimSoft: 'rgba(0, 0, 0, 0.35)', track: 'rgba(255, 255, 255, 0.35)' }

/** Spacing scale. `gutter` is the side padding of every page. */
const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, gutter: 16 }

/** control: buttons and inputs · card: boxes and tiles · sheet: sheets and the hero overlap. */
const radii = { control: 14, card: 16, sheet: 24, chip: 999, snap: 6 }

/** A #RRGGBB colour at an opacity, e.g. alpha(colors.leaf.DEFAULT, 0.4). */
function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

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

module.exports = { colors, ring, avatar, hero, overlay, space, radii, alpha, preset }
