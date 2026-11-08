# Page templates: how to build a screen

Every screen is one of the templates below, so the top bar, side padding, gaps and the place of the main
button are decided once. Pick the template, then fill it with shared parts. All of them come from
`@/components/ui`, and their values come from `@podmates/ui-tokens`.

## Which template

| The page is… | Use | Examples |
|---|---|---|
| A tab with a green hero | `TabHero` + `HeroHeading` + `HeroSheet` | Home, Explore |
| Pushed on the stack | `PushedScreen` (or `Header` + your list) | Community, user profile |
| A chat or comment thread | `ChatScreen` + `Composer` | Pod chat, DM, post |
| A form sheet (`presentation: 'formSheet'`) | `SheetScreen` (it is the ScrollView root sheets need) | Start a pod, Edit profile, Send to |
| A full-screen modal around one figure | `StageScreen` (`footer` = the big button) | Pod tree, pair tree |
| A photo or the camera | `MediaScreen` / `SnapFrame`, `Header tone="media"`, `IconButton tone="media"` | Snap, story, camera |

Profile is a tab, but it keeps its banner and has no top bar: the banner runs to the top of the screen, and the back and menu buttons float on it (`IconButton tone="media"`).

## Decisions

| Decision | Value |
|---|---|
| Side padding (gutter) | `space.gutter` = 16 |
| Brand green | `#00AB5A` = `colors.leaf.DEFAULT` = `hero.bg` |
| Top bar | `Header`, 52pt: `leading` is `back` (pushed), `close` (modal) or `none` (tab) |
| Main button in sheets | At the end of the content: `SheetScreen action={<Button size="lg" … />}` |
| Corner radius | `radii.control` 14 (buttons, inputs) · `radii.card` 16 (boxes, tiles) · `radii.sheet` 24 · `radii.chip` (pills) |
| Spacing | `space.xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 20 · `xxl` 24 · `xxxl` 32 |

## Shared parts

| Need | Use, not a hand-made copy |
|---|---|
| Text | `Text variant=…`: `display` 34, `title` 26, `headline` 19, `label` 16/600, `body` 16, `callout` 15, `subhead` 14, `caption` 12, `overline` 13 |
| Text input | `TextField` (label, hint, error, multiline) |
| A row in a list | `ListRow` (+ `RowIcon` for the round icon well) |
| A labelled group | `Section label="…"` |
| A pill (streak, tree HP, timer, on time) | `Chip` (`size="md"` and `onPress` for header actions) |
| Two or three options | `Segmented` |
| Loading / error / empty | `ScreenState` (`fill` to centre it in the page) |
| Over photos | `overlay.scrim`, `overlay.ink`, `overlay.track` |
| A colour at an opacity | `alpha(colors.leaf.DEFAULT, 0.4)` |

## Rules of thumb

- No raw `fontSize`/`fontWeight`: pick a `Text` variant. If none fits, add a variant instead of an inline size.
- No hex or rgba in screens: use a token, or add one to `packages/ui-tokens`.
- No numbers for padding, gaps or radii: use `space` and `radii`.
- Every list or fetched page shows `ScreenState` for loading, error and empty, never a blank view.
