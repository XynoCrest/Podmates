/**
 * The Podmates line-icon set (24×24, 2px round strokes), as SVG source.
 * `currentColor` is swapped for the requested colour at render time (see Icon.tsx).
 * Habit icons are keyed by habit id in HABIT_SVGS.
 */
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

export const SVG_ICONS = {
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  calendar: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>'),
  camera: svg('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2L9.5 4.5h5L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.3"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  checkedBadge: svg('<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M7.5 12.3l3 3 6-6" stroke="#fff" stroke-width="2.4"/>'),
  chevronDown: svg('<path d="M6 9.5l6 6 6-6"/>'),
  chevronRight: svg('<path d="M9.5 6l6 6-6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  community: svg('<circle cx="8.5" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3 19c.6-3 2.8-4.8 5.5-4.8S13.4 16 14 19"/><path d="M14.6 14.6c.6-.3 1.2-.4 1.9-.4 2.2 0 3.9 1.5 4.5 4"/>'),
  communityActive: svg('<circle cx="8.5" cy="9" r="3.2" fill="currentColor"/><circle cx="16.5" cy="10" r="2.6" fill="currentColor"/><path d="M3 19c.6-3 2.8-4.8 5.5-4.8S13.4 16 14 19z" fill="currentColor"/><path d="M14.6 14.6c.6-.3 1.2-.4 1.9-.4 2.2 0 3.9 1.5 4.5 4"/>'),
  delete: svg('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
  edit: svg('<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/>'),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>'),
  invite: svg('<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 20c.7-3.5 3.3-5.7 6.5-5.7 1.4 0 2.6.4 3.6 1.1"/><path d="M18.5 14v6M15.5 17h6"/>'),
  league: svg('<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 3 3.5M17 6h2.5a2.5 2.5 0 0 1-3 3.5"/><path d="M12 13v4M8.5 20.5h7"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  live: svg('<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/>'),
  location: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>'),
  more: svg('<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>'),
  notifications: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  nudge: svg('<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6.5c0 4.4-2.6 7.5-6.5 7.5-2.6 0-4-1.3-5.2-3.3L3 13.7a1.5 1.5 0 0 1 2.4-1.8L7 14"/>'),
  pending: svg('<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  pod: svg('<path d="M5 18.5C5.2 13.4 9.4 8 16.8 6.2C17.3 11.6 13.4 17.6 5 18.5Z"/>'),
  resting: svg('<path d="M7 9h5l-5 6h5M14 4h4l-4 5h4"/>'),
  retake: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4v4h4"/>'),
  save: svg('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>'),
  send: svg('<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>'),
  settings: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  streak: svg('<path d="M12 21.5c-4 0-7-2.8-7-6.6 0-3.4 2.4-5.4 3.8-7.6.5 1.8 1.5 2.8 2.6 3.2C11.6 7.4 12.8 4.6 15.5 2.5c-.2 3.3 3.5 5.6 3.5 11.2 0 4.6-3 7.8-7 7.8z"/>'),
  time: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.3 2"/>'),
  today: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.2l2.7 2.7L16 9.6"/>'),
  todayActive: svg('<circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none"/><path d="M8 12.2l2.7 2.7L16 9.6" stroke="#fff"/>'),
  tree: svg('<path d="M12 21V9"/><path d="M12 14C9.5 13.8 7 11.5 6.5 8 9.5 8.2 11.7 10.5 12 14z"/><path d="M12 11c2.6-.2 5-2.5 5.5-6-3 .2-5.2 2.5-5.5 6z"/>'),
  you: svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.8 7-5.8s6.2 2.2 7 5.8"/>'),
  youActive: svg('<circle cx="12" cy="8.5" r="3.7" fill="currentColor"/><path d="M5 20c.8-3.6 3.6-5.8 7-5.8s6.2 2.2 7 5.8z" fill="currentColor"/>'),
  // Habit-style icons (also used by HABIT_SVGS below).
  cook: svg('<path d="M4 11h16v4.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 15.5z"/><path d="M2 11h2M20 11h2"/><path d="M9 4c-.8 1 .8 2 0 3M13 4c-.8 1 .8 2 0 3"/>'),
  hydrate: svg('<path d="M12 3.2c3.3 4 5.5 7.1 5.5 10.3a5.5 5.5 0 0 1-11 0c0-3.2 2.2-6.3 5.5-10.3z"/>'),
  outside: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  readLessScreen: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M4 4l16 16"/>'),
  sleep: svg('<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>'),
  stretch: svg('<circle cx="12" cy="4.5" r="1.8"/><path d="M5 5l7 4 7-4"/><path d="M12 9v5.5"/><path d="M7.5 21l4.5-6.5 4.5 6.5"/>'),
  walk: svg('<circle cx="13.5" cy="4.5" r="1.8"/><path d="M11 21l2.2-5.2-2.6-2.6.9-4.6"/><path d="M10.6 8.6L7.5 10.2 6.5 13.5"/><path d="M11.5 8.6l2.8 2.6 3.2.8"/><path d="M13.2 15.8l2.3 2.2.8 3"/>'),
} as const

export type SvgIconName = keyof typeof SVG_ICONS

/** Seeded habit id → its line icon. Habits not listed keep their SF Symbol (habits.sf_symbol). */
export const HABIT_SVGS: Partial<Record<string, SvgIconName>> = {
  walking: 'walk',
  water: 'hydrate',
  sleep: 'sleep',
}
