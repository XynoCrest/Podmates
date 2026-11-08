/**
 * Podmates design tokens. Direction: a community garden at dusk. Warm dark soil
 * surfaces, one sprout-green accent, and two colours that only ever carry meaning.
 *
 *   leaf   → the accent: primary actions, "done today", a healthy tree
 *   sun    → time pressure: a snap window that is open right now
 *   danger → a wilting or dead tree, destructive actions
 *
 * Surfaces are a warm neutral ramp. Cards are "tiles": a 2px border with a thicker
 * bottom lip (`lip`), so pressable things look like they can be pressed down.
 *
 * CommonJS on purpose: Metro and Node scripts can both require() it. `preset` is a Tailwind preset
 * kept for a future web console; the app uses the raw values.
 */
const colors = {
  sunken: '#12110f',
  canvas: '#161513',
  surface: '#1c1a18',
  raised: '#262421',
  line: '#2f2c28',
  lip: '#3a3631',
  ink: { DEFAULT: '#efe9de', muted: '#aaa398', subtle: '#8a847a', inverse: '#161513' },
  leaf: { DEFAULT: '#7cc35f', soft: '#1f281b', deep: '#4e8a3a' },
  sun: { DEFAULT: '#e8b84a', soft: '#2a2416', deep: '#a9832b' },
  danger: { DEFAULT: '#e06a5a', soft: '#2b1a17', deep: '#a8483b' },
}

/** Person colours behind initials. Muted so they read as content, not chrome. */
const avatar = {
  leaf: '#4f7a40',
  sky: '#3f6782',
  star: '#695b8a',
  flame: '#9c5d36',
  rose: '#94495c',
  teal: '#3b766d',
}

const radii = { tile: 16, control: 12, chip: 8, photo: 12 }

/** Tailwind preset for a future web console. */
const preset = {
  theme: {
    extend: {
      colors,
      borderRadius: { tile: `${radii.tile}px`, control: `${radii.control}px` },
    },
  },
}

module.exports = { colors, avatar, radii, preset }
