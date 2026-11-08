import { memo, useEffect, useState } from 'react'
import { useReducedMotion } from 'react-native-reanimated'
import { hero } from '@podmates/ui-tokens'
import Svg, { Path } from 'react-native-svg'
import { GROVE_ASPECT, GROVE_PATHS, GROVE_VIEWBOX } from './grovePaths'

/** The hero band's colours (now the `hero` token). */
export const HERO = hero

type Kind = 'sil' | 'lo' | 'limb' | 'hi'

/** A Hairline figure's rest pose: paths painted back to front, and optionally a loop. */
export interface HairlineDrawing {
  viewBox: string
  aspect: number
  paths: readonly (readonly [Kind, string])[]
  /** `slots` are the indexes of the paths that move, `poses[p]` their shapes, `timeline[f]` the pose at frame f. */
  anim?: { fps: number; slots: readonly number[]; timeline: readonly number[]; poses: readonly (readonly string[])[] }
}

/** Plays a drawing's loop: returns the pose to show, or -1 for the rest pose. */
function usePose(anim: HairlineDrawing['anim']) {
  const reduce = useReducedMotion()
  // The pose belongs to the loop that set it, so a new drawing starts at rest.
  const [state, setState] = useState<{ anim: HairlineDrawing['anim']; pose: number }>({ anim, pose: -1 })
  useEffect(() => {
    if (!anim || reduce) return
    let frame = 0
    const id = setInterval(() => {
      frame = (frame + 1) % anim.timeline.length
      const pose = anim.timeline[frame]
      setState((s) => (s.anim === anim && s.pose === pose ? s : { anim, pose }))
    }, 1000 / anim.fps)
    return () => clearInterval(id)
  }, [anim, reduce])
  return anim && !reduce && state.anim === anim ? state.pose : -1
}

/** One stroke of a figure; memoised so only the paths that moved re-render. */
const Stroke = memo(function Stroke({ kind, d, ground, ink }: { kind: Kind; d: string; ground: string; ink: string }) {
  return (
    <Path
      d={d}
      fill={kind === 'sil' || kind === 'hi' ? ground : 'none'}
      stroke={ink}
      strokeOpacity={kind === 'hi' ? 1 : kind === 'lo' ? 0.45 : 0.8}
      strokeWidth={kind === 'hi' ? 1.6 : kind === 'lo' ? 0.8 : 1}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  )
})

/**
 * A Hairline figure: one stroke colour in three weights, plates filled with the ground
 * they sit on so the drawing stays honest (nearer parts hide farther ones). `ground` must
 * match the surface behind it. A drawing with `anim` loops while mounted, and holds its
 * rest pose when Reduce Motion is on.
 */
export function HairlineFigure({ drawing, height, ground, ink = '#FFFFFF' }: { drawing: HairlineDrawing; height: number; ground: string; ink?: string }) {
  const pose = usePose(drawing.anim)
  const moving = pose >= 0 && drawing.anim ? drawing.anim : undefined
  return (
    <Svg width={height * drawing.aspect} height={height} viewBox={drawing.viewBox}>
      {drawing.paths.map(([kind, d], i) => {
        const slot = moving ? moving.slots.indexOf(i) : -1
        return <Stroke key={i} kind={kind} d={slot >= 0 && moving ? moving.poses[pose][slot] : d} ground={ground} ink={ink} />
      })}
    </Svg>
  )
}

const GROVE: HairlineDrawing = { viewBox: GROVE_VIEWBOX, aspect: GROVE_ASPECT, paths: GROVE_PATHS }

/** The Grove hairline tree (Home's hero, onboarding's last step). */
export function GroveFigure({ height, ground, ink = '#FFFFFF' }: { height: number; ground: string; ink?: string }) {
  return <HairlineFigure drawing={GROVE} height={height} ground={ground} ink={ink} />
}
