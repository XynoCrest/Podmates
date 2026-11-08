type Tone = { DEFAULT: string; soft: string; deep: string }
export declare const colors: {
  canvas: string
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
export declare const radii: { card: number; control: number; chip: number; snap: number }
export declare const preset: Record<string, unknown>
