type Tone = { DEFAULT: string; soft: string; deep: string }
type AvatarColor = 'leaf' | 'sky' | 'star' | 'flame' | 'rose' | 'teal'
export declare const colors: {
  canvas: string
  surface: string
  raised: string
  sunken: string
  line: string
  lineStrong: string
  ink: { DEFAULT: string; muted: string; subtle: string; inverse: string }
  leaf: Tone & { bright: string }
  energy: Tone
  star: Tone
  flame: Tone
  danger: Tone
  sky: Tone
}
export declare const ring: [string, string, string]
export declare const avatar: Record<AvatarColor, string>
export declare const avatarSoft: Record<AvatarColor, string>
export declare const radii: { card: number; control: number; chip: number; snap: number }
export declare const preset: Record<string, unknown>
