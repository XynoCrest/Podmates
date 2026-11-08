# Design

Dark-first, with an evergreen charcoal canvas, warm raised surfaces, and muted colour reserved for
meaning: **leaf** = tree/health/done, **energy** = ⚡, **star** = ⭐, **flame** = 🔥 streaks and
*open snap window*, **danger** = wilting. Tokens live in `packages/ui-tokens`. Headings use a
platform serif (Georgia on iOS, system serif on Android); body and controls use the platform sans.
Type variants live in `components/ui/Text.tsx`.

| Screen | Reference | What we kept |
|---|---|---|
| Tab bar | iOS 26 Liquid Glass / Instagram | Native `NativeTabs` (`expo-router/native-tabs`, SDK 58). On iOS 26 the system draws the floating glass pill. Icon-only, outline → filled SF Symbols (house, safari, camera, person.crop.circle). Minimizes on scroll. |
| Pods (home) | Your whiteboard sketch + Messenger | Habit name tabs with underline → story row ("Your story" + podmates, gradient ring = unseen) → chat rows. The pod avatar's ring **is** the tree's health bar. |
| Chat | Messenger | Grouped bubbles per author, snaps as 3:4 cards with ON TIME / LATE badges, system messages as green pills, camera button left of the composer. |
| Tree | Duolingo "Flashcard Frenzy" screen | X top-left, muted title, ⚡ counter top-right, big illustration, one bold sentence with a coloured highlight, two-cell stat box (STAGE · HEALTH), week strip, chunky full-width button with a pressed-down "lip". |
| Camera | Snapchat | Full-bleed preview, big ring shutter in thumb reach, flash/flip top-right, library left. The pill top-left says which pod's window is open. |
| Send to | Snapchat "Send To" | Native formSheet; pods grouped by habit, each labelled On time / Late / Done. |
| Profile | Instagram (2025) | Avatar + three stats (Energy · Stars · Streak), bio, Edit / Share / add-person buttons, one **icon tab per habit**, 3:4 portrait grid. |
| Explore | Podmates editorial feed | Clear Community heading, joined/discover groups, explicit feed and sort controls, individually outlined post surfaces, community and author bylines, and thumb reactions with selected/error states. |

Motion and feedback follow Apple's guidance: press feedback on touch-down (`PressableScale`, 0.97),
one haptic per action (`lib/haptics.ts`), native sheets and modals for spatial consistency, and the
tree's breathing animation is turned off under Reduce Motion.

Research sources: Expo native tabs docs (SDK 57/58), Instagram's 2025 profile/grid changes (3:4 grid),
MacStories' Apollo review, and Snapchat camera UX write-ups.
