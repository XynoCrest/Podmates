import { colors, space } from '@podmates/ui-tokens'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, PressableScale, Text } from '@/components/ui'
import { haptics } from '@/lib/haptics'

/** Camera shortcut (chats) · message field · send. The one composer for chats and comments. */
/**
 * `onSend` returns the send's promise: if it fails, the text comes back (unless they've started a new
 * one) and a short error shows, so a message is never silently lost (offline, blocked, removed from the pod).
 */
export function Composer({ onSend, onCamera, sending, placeholder = 'Message' }: { onSend: (text: string) => Promise<unknown>; onCamera?: () => void; sending?: boolean; placeholder?: string }) {
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [failed, setFailed] = useState(false)
  const canSend = text.trim().length > 0 && !sending
  const send = async () => {
    if (!canSend) return
    const body = text.trim()
    haptics.tap()
    setText('')
    setFailed(false)
    try {
      await onSend(body)
    } catch {
      haptics.error()
      setText((now) => (now ? now : body))
      setFailed(true)
    }
  }
  return (
    <View>
      {failed ? (
        <Text variant="caption" center style={{ color: colors.danger.DEFAULT, paddingTop: space.xs }} accessibilityLiveRegion="polite">
          Couldn’t send. Check your connection and try again.
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: colors.canvas, borderTopWidth: 0.5, borderTopColor: colors.line }}>
        {onCamera ? (
          <PressableScale onPress={onCamera} accessibilityLabel="Snap a photo" scaleTo={0.9}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sky.deep, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="cameraFill" size={19} color={colors.ink.DEFAULT} />
            </View>
          </PressableScale>
        ) : null}
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t)
            setFailed(false)
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.ink.subtle}
          multiline
          style={{ flex: 1, minHeight: 40, maxHeight: 120, borderRadius: 20, backgroundColor: colors.raised, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, color: colors.ink.DEFAULT, fontSize: 16 }}
        />
        <PressableScale onPress={send} disabled={!canSend} accessibilityLabel="Send" scaleTo={0.9}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: canSend ? colors.ink.DEFAULT : colors.raised, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={18} color={canSend ? colors.ink.inverse : colors.ink.subtle} weight="bold" />
          </View>
        </PressableScale>
      </View>
    </View>
  )
}
