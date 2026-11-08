import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, PressableScale } from '@/components/ui'
import { haptics } from '@/lib/haptics'

/** Green camera shortcut · outlined message field · send (appears once there is text). */
export function Composer({ onSend, onCamera, sending, placeholder = 'Message' }: { onSend: (text: string) => void; onCamera: () => void; sending?: boolean; placeholder?: string }) {
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const canSend = text.trim().length > 0 && !sending
  const send = () => {
    if (!canSend) return
    haptics.tap()
    onSend(text.trim())
    setText('')
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.line }}>
      <PressableScale onPress={onCamera} accessibilityLabel="Snap a photo" scaleTo={0.9}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.leaf.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera" size={26} color={colors.ink.inverse} />
        </View>
      </PressableScale>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink.subtle}
        multiline
        style={{ flex: 1, minHeight: 56, maxHeight: 130, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, color: colors.ink.DEFAULT, fontSize: 18 }}
      />
      {canSend ? (
        <PressableScale onPress={send} accessibilityLabel="Send" scaleTo={0.9}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.leaf.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={22} color={colors.ink.inverse} weight="bold" />
          </View>
        </PressableScale>
      ) : null}
    </View>
  )
}
