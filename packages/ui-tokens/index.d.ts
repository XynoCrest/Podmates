type Tone = { DEFAULT: string; soft: string; deep: string }
export declare const colors: {
  canvas: string
  hero: string
  surface: string
  raised: string
  sunken: string
  line: string
  ink: { DEFAULT: string; muted: string; subtle: string; inverse: string }
  leaf: Tone
  energy: Tone
  star: Tone
  flame: Tone
  danger: Tone
  sky: Tone
}
export declare const ring: [string, string, string]
export declare const avatar: Record<'leaf' | 'sky' | 'star' | 'flame' | 'rose' | 'teal', string>
export declare const hero: { bg: string; ink: string; soft: string; faint: string; bright: string }
export declare const overlay: { media: string; ink: string; scrim: string; scrimSoft: string; track: string }
export declare const space: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; xxxl: number; gutter: number }
export declare const radii: { control: number; card: number; sheet: number; chip: number; snap: number }
export declare function alpha(hex: string, a: number): string
export declare const preset: Record<string, unknown>
