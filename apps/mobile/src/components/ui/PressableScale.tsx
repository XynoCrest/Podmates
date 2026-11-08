import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)

/**
 * Press feedback for every tappable surface: scale to 0.97 on press-IN
 * (feedback must not wait for the tap to finish), 120ms strong ease-out.
 * A Reanimated CSS transition — a two-state change needs no shared values.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  flex,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  scaleTo?: number
  /** Grow to fill the row (sets flex: 1 on both the touch target and the scaled view). */
  flex?: boolean
}) {
  return (
    <Pressable pressRetentionOffset={16} style={flex ? { flex: 1 } : undefined} {...props}>
      {({ pressed }) => (
        <Animated.View
          style={[
            // flexGrow, not flex: 1. A zero flex-basis would collapse the face to 0 height inside the column Pressable.
            flex ? { flexGrow: 1 } : null,
            style,
            {
              transform: [{ scale: pressed && !props.disabled ? scaleTo : 1 }],
              transitionProperty: 'transform',
              transitionDuration: 120,
              transitionTimingFunction: EASE_OUT,
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Pressable>
  )
}
