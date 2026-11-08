type Tone = { DEFAULT: string; soft: string; deep: string }
export declare const colors: {
  sunken: string
  canvas: string
  surface: string
  raised: string
  line: string
  lip: string
  ink: { DEFAULT: string; muted: string; subtle: string; inverse: string }
  leaf: Tone
  sun: Tone
  danger: Tone
}
export declare const avatar: Record<'leaf' | 'sky' | 'star' | 'flame' | 'rose' | 'teal', string>
export declare const radii: { tile: number; control: number; chip: number; photo: number }
export declare const preset: Record<string, unknown>
