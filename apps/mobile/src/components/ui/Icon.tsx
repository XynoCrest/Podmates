import { colors } from '@podmates/ui-tokens'
import { SymbolView, type SymbolWeight } from 'expo-symbols'
import type { ColorValue } from 'react-native'

/**
 * Semantic icon names → SF Symbols on iOS, Material Symbols on Android/web.
 * Outline-by-default like Instagram; `…Fill` variants for selected states.
 * Add a row here instead of using raw symbol names in screens.
 */
const ICONS = {
  home: { ios: 'house', android: 'home' },
  explore: { ios: 'magnifyingglass', android: 'search' },
  camera: { ios: 'camera', android: 'photo_camera' },
  cameraFill: { ios: 'camera.fill', android: 'photo_camera' },
  profile: { ios: 'person.crop.circle', android: 'account_circle' },
  plus: { ios: 'plus', android: 'add' },
  plusSquare: { ios: 'plus.app', android: 'add_box' },
  close: { ios: 'xmark', android: 'close' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  send: { ios: 'arrow.up', android: 'arrow_upward' },
  paperplane: { ios: 'paperplane.fill', android: 'send' },
  flip: { ios: 'arrow.triangle.2.circlepath.camera', android: 'flip_camera_ios' },
  flashOn: { ios: 'bolt.fill', android: 'flash_on' },
  flashOff: { ios: 'bolt.slash', android: 'flash_off' },
  photo: { ios: 'photo.on.rectangle', android: 'photo_library' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  star: { ios: 'star.fill', android: 'star' },
  flame: { ios: 'flame.fill', android: 'local_fire_department' },
  leaf: { ios: 'leaf.fill', android: 'eco' },
  tree: { ios: 'tree.fill', android: 'park' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  circle: { ios: 'circle', android: 'radio_button_unchecked' },
  clock: { ios: 'clock', android: 'schedule' },
  timer: { ios: 'timer', android: 'timer' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  comment: { ios: 'bubble.left', android: 'chat_bubble_outline' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  menu: { ios: 'line.3.horizontal', android: 'menu' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add' },
  people: { ios: 'person.2', android: 'group' },
  grid: { ios: 'square.grid.3x3', android: 'grid_on' },
  trophy: { ios: 'trophy', android: 'emoji_events' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  hammer: { ios: 'hammer', android: 'build' },
  moon: { ios: 'moon.stars', android: 'bedtime' },
  bulb: { ios: 'lightbulb', android: 'lightbulb' },
  sprout: { ios: 'leaf', android: 'eco' },
  dot: { ios: 'circle.fill', android: 'circle' },
} as const

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
  weight?: SymbolWeight
}) {
  const symbol = ICONS[name]
  return (
    <SymbolView
      name={{ ios: symbol.ios, android: symbol.android, web: symbol.android } as never}
      size={size}
      tintColor={color}
      weight={weight}
      style={{ width: size, height: size }}
    />
  )
}

/** For habit SF symbols that come from the database (habits.sf_symbol). */
export function SymbolIcon({ name, size = 22, color = colors.ink.DEFAULT }: { name: string; size?: number; color?: ColorValue }) {
  return <SymbolView name={name as never} size={size} tintColor={color} style={{ width: size, height: size }} />
}
