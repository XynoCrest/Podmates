# Design

**Direction: a community garden at dusk.** Podmates is a few friends tending one shared tree, so the
interface borrows from a garden plot: warm dark soil surfaces, one sprout-green accent, and
wooden plant labels. Character: sunny, encouraging, a little scrappy.

- **Colour** (`packages/ui-tokens`): a warm dark neutral ramp (`canvas`, `surface`, `raised`, `line`,
  `lip`), one accent `leaf`, and two colours that only carry meaning. `sun` means a snap window is
  open right now. `danger` means wilting, dead or destructive.
- **Type:** Figtree (`@expo-google-fonts/figtree`), weights 400/500/600 only, sentence case,
  tabular figures for numbers. `components/ui/Text.tsx` maps weights to font files. Inputs use `inputText`.
- **Material:** every card is a `Tile` with a 2px border and a 4px bottom lip. Buttons are chunky: a
  face on a darker lip that sinks on touch-down. The material is borrowed from Duolingo; its
  layouts, mascot and colours are not.
- **Signature:** `PlantLabel`, a small plant-stake tag with a pointed end and a punched hole. It
  carries every pod status (`8 min left`, `Done`, `Opens 9:00 PM`, `Replant`) on the home rows,
  chat, tree, camera, send sheet and snap viewer. It appears nowhere else.
- **Moments:** the tree in its raised garden bed (`features/tree/TreeArt.tsx`) and the snap photos.
  Everything around them stays quiet.
- **Icons:** SF Symbols through `Icon` / `SymbolIcon` at one weight, in the text colours. No emoji in
  the UI. Habits and communities use `habits.sf_symbol`.
- **Motion:** touch-down feedback only (the press into the lip, `PressableScale`). No looping or
  breathing animation.
- The camera and the snap/story viewer stay photo-dark. The tab bar is the native iOS 26 glass pill,
  tinted leaf.

| Screen | What it is now |
|---|---|
| Your pods | Habit pill tabs → "time left to snap" tile in sun when a window is open → strip of today's snap photos with the person's face pinned to the corner (a green edge means unseen) → pod tiles with a plant label, health bar, streak and today's count |
| Chat | Bordered bubbles (yours leaf-tinted), snaps as photo tiles with a plant label, tree news as a quiet line with a leaf |
| Tree | The garden plot tile with today's gardeners → one sentence about tonight → a Stage / Health / Your streak list → seven day markers → one chunky button |
| Profile | Name, handle and bio → three stat tiles (Energy, Perfect days, Day streak) → actions → habit pills → rounded 4:5 grid of kept snaps |
| Communities | Joined / Everyone segmented control, sort menu, community chips, post tiles with a single up · score · down control |

Spacing is on a 4px grid: 16 page padding, 12 between tiles, 16 inside tiles, 48 input and 44/52 button heights.
