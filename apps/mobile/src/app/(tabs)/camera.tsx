import { colors } from '@podmates/ui-tokens'
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera'
import * as Device from 'expo-device'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Icon, IconButton, PressableScale, StatusPill, Text, type IconName } from '@/components/ui'
import { needsSnap, podWindow, useMyPods } from '@/features/pods/hooks'
import { setPendingCapture } from '@/features/snaps/pendingCapture'
import { haptics } from '@/lib/haptics'
import { goBack } from '@/lib/nav'
import { useNow } from '@/lib/useNow'

/** The Simulator has no camera; it gets library + demo-photo buttons instead. */
const HAS_CAMERA = Device.isDevice

/**
 * Capture: the pod and its countdown on top, a framed live preview, a big green shutter.
 * Real phones shoot live only (no library), so a snap is proof from inside the window.
 * Capture → the "Send to" sheet picks pods.
 */
export default function CameraScreen() {
  const { podId } = useLocalSearchParams<{ podId?: string }>()
  const insets = useSafeAreaInsets()
  const camera = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [flash, setFlash] = useState<FlashMode>('off')
  const [focused, setFocused] = useState(true)
  const [busy, setBusy] = useState(false)

  // Release the camera when the tab isn't visible (battery, and the green dot).
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )

  const goSend = (uri: string) => {
    setPendingCapture(uri)
    router.push({ pathname: '/send', params: { podId: podId ?? '' } })
  }

  async function shoot() {
    if (!camera.current || busy) return
    haptics.shutter()
    setBusy(true)
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85, skipProcessing: false })
      if (photo?.uri) goSend(photo.uri)
    } finally {
      setBusy(false)
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [3, 4] })
    if (!result.canceled && result.assets[0]) goSend(result.assets[0].uri)
  }

  const useDemoPhoto = () => goSend(`https://picsum.photos/seed/${Date.now()}/1080/1440`)
  const live = HAS_CAMERA && !!permission?.granted

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}>
      <TopBar podId={podId} />

      <View style={{ flex: 1, marginHorizontal: 20, marginTop: 8, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1F3A2B' }}>
        {live && focused ? (
          <CameraView ref={camera} style={{ flex: 1 }} facing={facing} flash={flash} mirror={facing === 'front'} />
        ) : (
          <NoCamera reason={!HAS_CAMERA ? 'simulator' : permission && !permission.granted ? 'permission' : 'loading'} onAllow={requestPermission} onLibrary={pickFromLibrary} onDemo={useDemoPhoto} />
        )}
        {live ? (
          <>
            <Corners />
            <View style={{ position: 'absolute', top: 18, left: 18, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(20,52,36,0.9)' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Live camera only</Text>
            </View>
          </>
        ) : null}
      </View>

      {live ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48, paddingTop: 20 }}>
          <RoundButton icon="flip" label="Flip camera" onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} />
          <PressableScale onPress={shoot} scaleTo={0.92} accessibilityLabel="Take snap" disabled={busy}>
            <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.leaf.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: busy ? colors.leaf.deep : colors.leaf.DEFAULT }} />
            </View>
          </PressableScale>
          <RoundButton icon={flash === 'on' ? 'flashOn' : 'flashOff'} label={flash === 'on' ? 'Flash on' : 'Flash off'} onPress={() => setFlash(flash === 'on' ? 'off' : 'on')} />
        </View>
      ) : null}
      <Text center style={{ paddingTop: 14, fontSize: 16, color: colors.ink.muted }}>
        Snap inside the window to count
      </Text>
    </View>
  )
}

/** Close · which pod you're snapping for · how long its window stays open (to the second). */
function TopBar({ podId }: { podId?: string }) {
  const now = useNow(1000)
  const pods = useMyPods()
  const target = pods.data?.find((p) => p.id === podId) ?? pods.data?.find((p) => needsSnap(p, now))
  const w = target ? podWindow(target, now) : null
  let pill: { tone: 'warn' | 'good' | 'neutral'; label: string } | null = null
  if (target && w) {
    if (target.meContributedToday) pill = { tone: 'good', label: 'Done today' }
    else if (w.status === 'open') {
      // Windows start on whole minutes, so seconds left = minutes left × 60 − seconds into this minute.
      const secs = Math.max(0, w.closesInMin * 60 - now.getSeconds())
      pill = { tone: 'warn', label: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} left in the window` }
    } else pill = { tone: 'neutral', label: w.status === 'upcoming' ? 'Window not open yet' : 'Window closed' }
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 20, minHeight: 56, gap: 8 }}>
      <IconButton icon="close" label="Close camera" onPress={goBack} />
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 21, fontWeight: '700' }}>
        {target?.name ?? 'Snap'}
      </Text>
      {pill ? <StatusPill tone={pill.tone} label={pill.label} /> : null}
    </View>
  )
}

/** Viewfinder corner brackets. */
function Corners() {
  const arm = 56
  const t = 5
  const c = 'rgba(255,255,255,0.85)'
  const at = (pos: object, h: 'Left' | 'Right', v: 'Top' | 'Bottom') => (
    <View pointerEvents="none" style={[{ position: 'absolute', width: arm, height: arm * 2.2, borderColor: c, [`border${h}Width`]: t, [`border${v}Width`]: t, [`border${v}${h}Radius`]: 14 }, pos]} />
  )
  return (
    <>
      {at({ top: 20, left: 20 }, 'Left', 'Top')}
      {at({ top: 20, right: 20 }, 'Right', 'Top')}
      {at({ bottom: 20, left: 20 }, 'Left', 'Bottom')}
      {at({ bottom: 20, right: 20 }, 'Right', 'Bottom')}
    </>
  )
}

function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} accessibilityLabel={label}>
      <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={30} color={colors.ink.muted} weight="medium" />
      </View>
    </PressableScale>
  )
}

function NoCamera({ reason, onAllow, onLibrary, onDemo }: { reason: 'simulator' | 'permission' | 'loading'; onAllow: () => void; onLibrary: () => void; onDemo: () => void }) {
  if (reason === 'loading') return <View style={{ flex: 1 }} />
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14, backgroundColor: colors.leaf.soft }}>
      <Icon name="camera" size={44} color={colors.leaf.DEFAULT} />
      <Text variant="headline" center>
        {reason === 'simulator' ? "The Simulator doesn't have a camera" : 'Podmates needs the camera to snap'}
      </Text>
      <Text variant="subhead" center>
        {reason === 'simulator' ? 'Pick a photo or use a demo shot. On a phone, snaps are live camera only.' : 'Snaps are live proof for your pod, so there is no photo library here. Nothing is recorded until you press the shutter.'}
      </Text>
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 8 }}>
        {reason === 'permission' ? <Button label="Allow camera" icon="camera" onPress={onAllow} /> : null}
        {reason === 'simulator' ? (
          <>
            <Button label="Use a demo photo" icon="sparkles" onPress={onDemo} />
            <Button label="Choose from library" icon="photo" variant="outline" onPress={onLibrary} />
          </>
        ) : null}
      </View>
    </View>
  )
}
