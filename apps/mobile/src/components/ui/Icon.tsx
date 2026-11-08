import { colors } from '@podmates/ui-tokens'
import { SymbolView, type SymbolWeight } from 'expo-symbols'
import type { ColorValue } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { HABIT_SVGS, SVG_ICONS, type SvgIconName } from './svgIcons'

type Source = { svg: SvgIconName } | { ios: string; android: string }

/**
 * Semantic icon names → the Podmates line icons (svgIcons.ts) where one exists,
 * else SF Symbols on iOS / Material Symbols on Android and web.
 * Add a row here instead of using raw icon names in screens.
 */
const ICONS = {
  home: { ios: 'house', android: 'home' },
  chat: { ios: 'bubble.left', android: 'chat_bubble_outline' },
  chatFill: { ios: 'bubble.left.fill', android: 'chat_bubble' },
  explore: { svg: 'search' },
  camera: { svg: 'camera' },
  cameraFill: { svg: 'camera' },
  profile: { svg: 'you' },
  profileFill: { svg: 'youActive' },
  plus: { svg: 'plus' },
  plusSquare: { svg: 'plus' },
  close: { svg: 'close' },
  back: { svg: 'back' },
  chevronRight: { svg: 'chevronRight' },
  chevronDown: { svg: 'chevronDown' },
  send: { ios: 'arrow.up', android: 'arrow_upward' },
  paperplane: { svg: 'send' },
  flip: { svg: 'retake' },
  flashOn: { ios: 'bolt.fill', android: 'flash_on' },
  flashOff: { ios: 'bolt', android: 'flash_off' },
  photo: { ios: 'photo.on.rectangle', android: 'photo_library' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  star: { ios: 'star.fill', android: 'star' },
  flame: { svg: 'streak' },
  leaf: { svg: 'pod' },
  tree: { svg: 'tree' },
  check: { svg: 'check' },
  checkCircle: { svg: 'checkedBadge' },
  circle: { ios: 'circle', android: 'radio_button_unchecked' },
  pending: { svg: 'pending' },
  clock: { svg: 'time' },
  timer: { svg: 'time' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward' },
  comment: { ios: 'bubble.left', android: 'chat_bubble_outline' },
  more: { svg: 'more' },
  menu: { ios: 'line.3.horizontal', android: 'menu' },
  settings: { svg: 'settings' },
  edit: { svg: 'edit' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  personAdd: { svg: 'invite' },
  people: { svg: 'community' },
  grid: { ios: 'square.grid.3x3', android: 'grid_on' },
  trophy: { svg: 'league' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  refresh: { svg: 'retake' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  hammer: { ios: 'hammer', android: 'build' },
  moon: { svg: 'resting' },
} as const satisfies Record<string, Source>

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 22,
  color = colors.ink.DEFAULT,
  weight = 'regular',
}: {
  name: IconName
  size?: number
  color?: ColorValue
  /** SF Symbols only; the line icons have a fixed 2px stroke. */
  weight?: SymbolWeight
}) {
  const source: Source = ICONS[name]
  if ('svg' in source) return <LineIcon name={source.svg} size={size} color={color} />
  return (
    <SymbolView
      name={{ ios: source.ios, android: source.android, web: source.android } as never}
      size={size}
      tintColor={color}
      weight={weight}
      style={{ width: size, height: size }}
    />
  )
}

/** One of the Podmates line icons, tinted. */
export function LineIcon({ name, size = 22, color = colors.ink.DEFAULT }: { name: SvgIconName; size?: number; color?: ColorValue }) {
  return <SvgXml xml={SVG_ICONS[name].replaceAll('currentColor', String(color))} width={size} height={size} />
}

/** A habit's icon: its Podmates line icon when there is one, else the SF Symbol stored on the habit. */
export function HabitIcon({ habit, size = 22, color = colors.ink.DEFAULT }: { habit: { id: string; sf_symbol: string }; size?: number; color?: ColorValue }) {
  const svg = HABIT_SVGS[habit.id]
  if (svg) return <LineIcon name={svg} size={size} color={color} />
  return <SymbolView name={habit.sf_symbol as never} size={size} tintColor={color} style={{ width: size, height: size }} />
}
