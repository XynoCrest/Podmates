import type { Habit } from '../hooks'
import { CardCarousel, type CarouselItem } from './CardCarousel'

/** What each card says under its name, and the caption under the carousel. */
const COPY: Record<string, { goal: string; about: string }> = {
  reading: { goal: '20 pages a day', about: 'Snap the page you got to. A few pages every day adds up to a shelf of finished books.' },
  running: { goal: '3 km or 20 minutes', about: 'Snap your run, the route, the watch or the shoes by the door. Any distance keeps the streak.' },
  swimming: { goal: '20 lengths', about: 'Snap the pool, the lane or the wet towel. Laps logged together are easier to show up for.' },
  meditation: { goal: '10 quiet minutes', about: 'Snap your spot when you finish. A short daily sit beats the long one you keep putting off.' },
  gym: { goal: 'One session', about: 'Snap the rack, the plates or the mirror. Your pod sees who made it in today.' },
  journaling: { goal: 'One page', about: 'Snap the page (cover the words if you like). Writing a little each day keeps the thread.' },
  walking: { goal: '8,000 steps', about: 'Snap the view from your walk. The easiest habit to start, and to keep.' },
  coding: { goal: 'One commit', about: 'Snap the editor or the green check. Small daily progress on the thing you are building.' },
  water: { goal: '8 glasses', about: 'Snap the bottle or the glass. A simple daily check-in that your pod can nudge you on.' },
  sleep: { goal: 'In bed by 11', about: 'Snap the lights-out. A steady bedtime is the habit that makes the others easier.' },
}

/** What a habit says about itself: an example daily goal and a line on what to snap. */
export const habitCopy = (h: Habit) => COPY[h.id] ?? { goal: 'Once a day', about: `Snap your ${h.name.toLowerCase()} every day with your pod.` }

/** The "Start a pod" habit picker: one card per habit in the catalogue, the centre one picked. */
export function HabitCarousel({ habits, value, onChange }: { habits: Habit[]; value: string; onChange: (id: string) => void }) {
  const items: CarouselItem[] = habits.map((h) => {
    const copy = habitCopy(h)
    return { id: h.id, figure: h.id, label: `Habit ${String(h.sort).padStart(2, '0')}`, title: h.name, sub: copy.goal, about: copy.about, a11y: `${h.name}, ${copy.goal}` }
  })
  return (
    <CardCarousel
      items={items}
      index={Math.max(0, habits.findIndex((h) => h.id === value))}
      onIndex={(i) => {
        const h = habits[i]
        if (h) onChange(h.id)
      }}
      label="Habit"
    />
  )
}
