import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, PressableScale } from '@/components/ui'
import { haptics } from '@/lib/haptics'

/** Camera shortcut · message field · send. */
export function Composer({ onSend, onCamera, sending }: { onSend: (text: string) => void; onCamera: () => void; sending?: boolean }) {
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
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: colors.canvas, borderTopWidth: 0.5, borderTopColor: colors.line }}>
      <PressableScale onPress={onCamera} accessibilityLabel="Snap a photo" scaleTo={0.9}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sky.deep, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cameraFill" size={19} color="#fff" />
        </View>
      </PressableScale>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Message"
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
  )
}
