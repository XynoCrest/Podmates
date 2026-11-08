import type { IconName } from '@/components/ui'

/** A glyph per seeded community; any other community falls back to its initial. */
export const COMMUNITY_ICONS: Record<string, IconName> = {
  bookworms: 'book',
  runclub: 'run',
  swimmers: 'swim',
  mindful: 'mindful',
  gymrats: 'dumbbell',
  habitscience: 'brain',
}
