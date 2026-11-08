import { colors } from '@podmates/ui-tokens'
import { HomeView, type PodItem, type PodmateItem, type RailItem } from './HomeView'

/**
 * The home screen on fixtures: no Supabase, no API, no session. This is how the
 * design gets reviewed in Expo Go before the local stack is up, and it keeps
 * <HomeView /> honest about being presentational.
 *
 * Photos are remote placeholders (pravatar), so this needs the internet but
 * nothing of ours. See docs/PLACEHOLDERS.md.
 */
const rail: RailItem[] = [
  { id: 'read', label: 'Read', glyph: 'read', streak: 4, done: true },
  { id: 'swim', label: 'Swim', glyph: 'swim', streak: 17, done: true },
  { id: 'run', label: 'Run', glyph: 'run', streak: 28, done: false },
]

const podmates: PodmateItem[] = [
  {
    id: 'mark',
    person: { display_name: 'Mark', avatar_color: 'leaf', avatar_url: 'https://i.pravatar.cc/160?img=12' },
    sub: 'Read · 11 hrs left',
    glyph: 'read',
    streak: 9,
    fresh: true,
  },
  {
    id: 'emma',
    person: { display_name: 'Emma', avatar_color: 'rose', avatar_url: 'https://i.pravatar.cc/160?img=47' },
    sub: 'Run · 11 hrs left',
    glyph: 'run',
    streak: 11,
    fresh: true,
    tint: colors.flame.DEFAULT,
  },
  {
    id: 'nabil',
    person: { display_name: 'Nabil', avatar_color: 'sky', avatar_url: 'https://i.pravatar.cc/160?img=33' },
    sub: 'Swim · 4 hrs left',
    glyph: 'swim',
    streak: 4,
    fresh: false,
  },
]

const pods: PodItem[] = [
  { id: 'rexall', name: 'Rexall Swim', sub: 'Matt posted 1 min ago', person: { display_name: 'Rexall Swim', avatar_color: 'teal', avatar_url: 'https://i.pravatar.cc/160?img=65' }, ratio: 0.86 },
  { id: 'volley', name: 'Volleyball YYC', sub: 'Emma posted 17 min ago', person: { display_name: 'Volleyball YYC', avatar_color: 'flame', avatar_url: 'https://i.pravatar.cc/160?img=52' }, ratio: 0.48 },
  { id: 'knit', name: 'Knitting Clurb', sub: 'Alex posted 1 hr ago', person: { display_name: 'Knitting Clurb', avatar_color: 'star', avatar_url: 'https://i.pravatar.cc/160?img=27' }, ratio: 0.52 },
]

export function HomePreview() {
  return <HomeView rail={rail} podmates={podmates} pods={pods} />
}
