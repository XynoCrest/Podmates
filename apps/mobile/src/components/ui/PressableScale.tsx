import { useState } from 'react'
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)

/**
 * Press feedback for every tappable surface: scale to 0.97 on press-IN
 * (feedback must not wait for the tap to finish), with hover and focus states.
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
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  return (
    <Pressable
      pressRetentionOffset={16}
      style={flex ? { flex: 1 } : undefined}
      {...props}
      onHoverIn={(event) => {
        props.onHoverIn?.(event)
        setHovered(true)
      }}
      onHoverOut={(event) => {
        props.onHoverOut?.(event)
        setHovered(false)
      }}
      onFocus={(event) => {
        props.onFocus?.(event)
        setFocused(true)
      }}
      onBlur={(event) => {
        props.onBlur?.(event)
        setFocused(false)
      }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            flex ? { flex: 1 } : null,
            style,
            {
              transform: [{ scale: pressed && !props.disabled ? scaleTo : 1 }],
              opacity: focused ? 0.9 : hovered && !pressed ? 0.96 : 1,
              transitionProperty: 'all',
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
