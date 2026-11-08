# UI audit: why every page looks different, and the templates that would fix it

Audited on `feature/maria_design_normalization` (from `feat/ui-rework-og` at 43ff69a), 2026-11-08.

**Status:** implemented on this branch. The decisions made are in [TEMPLATES.md](TEMPLATES.md), which is the guide for new screens.
Every screen in `apps/mobile/src/app` was read and screenshotted in the iOS Simulator (iPhone 17 Pro).

## 1. The short version

The app has good building blocks (`Text` variants, `Button`, `Header`, `Chip`, `Segmented`,
`EmptyState`, colour tokens). Most screens don't use them, though: each screen re-draws its own top bar, inputs, pills,
rows and empty states with slightly different numbers. The result is **8 page shapes, 5 kinds of top bar,
9+ title sizes, 3 paddings, 7 corner radii, 6 text inputs and 3 different greens**.

The fix: define **6 page templates** and **~8 shared parts**, plus a few missing tokens (spacing, a single
brand green, overlay colours), then move each screen onto them.

## 2. What exists today

| Shape | Screens | Top of page |
|---|---|---|
| Hero band + overlapping sheet | Home, Onboarding | Hero heading (28/700 on Home, 34/700 on Onboarding). Two separate implementations. |
| Tab page with custom bar | Explore, Profile, user/[id] | Explore: search bar, **no title**. Profile: own 48px bar with 22/600 username |
| Pushed page with shared `Header` | Pod chat, DM chat, Community, Post | `Header` (52px, back, 19/600 title). The **only 4 users** of `Header` |
| Chat | Pod chat, DM chat, Post comments | Pod and DM use `Composer`; Post has its own input |
| Full-screen game | Pod tree, Pair tree | Copied 52px close bar, centred title, flame count |
| Form sheet | Start a pod, New post, Edit profile, Habit calendar, Pick snaps, Send to | Inline `title` in the content, or **no title** (Start a pod) |
| Media viewer | Camera, Snap, Story, Day | Translucent discs and pills drawn by hand |
| Auth / intro | Sign-in, Onboarding | `display` title / own hero |

Contact sheet of every page: `~/.cache/podmates-design/contact-sheet.jpg` (local only, not committed).

## 3. The inconsistencies that show most

1. **Top bars.** Today there are five kinds:
   - the shared `Header`;
   - the tree close bar, copied twice (`pod/[id]/tree.tsx:56`, `dm/[userId]/tree.tsx:68`);
   - Profile's own bar (`ProfileView.tsx:72`);
   - Onboarding's `TopBar`;
   - the snap viewer's back disc (`SnapFrame.tsx:24`).

   The bars are 52 or 48 px high, and the back button is drawn three different ways.
2. **Page titles.** At least nine sizes are used:
   - `headline` 19 in `Header`;
   - inline 22/600 on Profile;
   - 24/700 for the display name;
   - `title` 26 in sheets;
   - 26/600 on the trees;
   - 28/700 on the Home hero;
   - `display` 34/600 on Sign-in;
   - 34/700 on Onboarding;
   - none at all on Explore and Start a pod.
3. **Side padding.** It is 16 on Home's sheet, Explore and Profile, but 20 on sheets, trees, Onboarding and Home's hero, and 24 on Sign-in.
   On Home, the hero (20) and the list (16) don't line up.
4. **Space between blocks in sheets** varies: 14 (New post), 16 (Habit), 18 (Send, Edit profile) and 20 (Start a pod).
5. **Corner radii.** The values in use are 12, 14, 16, 20, 22, 24 and 28. The tokens `radii.card = 20` and `radii.control = 14`
   are imported once in the whole app (`MessageBubble.tsx:44`). Inputs use 12 while buttons use 14. Cards use 14 or 16.
6. **Text inputs are rebuilt 6 times**, each a little different:
   - Sign-in: 48 tall, with a border on `surface`;
   - Start a pod: 46 tall, on `raised`;
   - Edit profile;
   - New post;
   - Send caption;
   - Post comment: radius 20.
7. **Pills.** At least four are drawn inline instead of using `Chip`:
   - the pod chat's tree pill and the DM streak pill, which are copies of each other;
   - Explore's feed pill;
   - the camera's window pill.
8. **Segmented control.** Start a pod draws its own Start / Join switch although `Segmented` exists.
9. **List rows.** `PodRow`, `PodmateRow`, Onboarding's `ActionRow`, Send's `PodChoice` and the post comment row are five near-copies.
10. **Empty, loading and error states**:
    - `EmptyState` is used on 3 screens. Five more use a hand-made grey sentence, and the camera has its own copy.
    - Loading shows a spinner on some screens, a blank black view on others (the trees, snap, story), and nothing on the rest.
    - List screens never show errors.
11. **Three greens:**
    - Home hero `#46A862`;
    - Onboarding `#00AB5A`;
    - the `leaf` token `#7BD64B`, used by the tree, calendar, check marks and buttons.

    The token file has no brand colour, so each screen picks its own.
12. **Colours outside the tokens:**
    - the camera: 5 hex + 3 rgba;
    - the snap frame: 5 hex + 6 rgba;
    - the habit carousel: 13 hex;
    - Onboarding: its own green palette;
    - `'#000'` for the media screens.

    There are no tokens for "black at 50%" overlays, so every media screen invents its own.
13. **Primary button** placement differs from sheet to sheet:
    - inline at the end of the content: Start a pod, New post, Send;
    - pinned to the bottom: the trees (`ChunkyButton`), Onboarding;
    - none: Pick snaps, which saves on tap.

## 4. Proposed templates

Each template is one component that owns the safe area, background, padding, top bar and states, so a screen
only supplies its content.

| Template | Used by | What it fixes |
|---|---|---|
| **T1 `TabScreen`**: hero band + sheet, or large-title variant | Home, Explore, Profile | One heading size, one padding, one way the sheet overlaps |
| **T2 `PushedScreen`**: `Header` (back, title, subtitle, right actions) + scrolling body | Community, Post, user/[id], Pod/DM chat | Every pushed page gets the same 52px bar and back button |
| **T3 `ChatScreen`**: T2 + inverted list + `Composer` | Pod chat, DM chat, Post comments | Post comments get the real composer |
| **T4 `SheetScreen`**: grabber, title row (title + optional subtitle/close), body, **pinned primary button** | Start a pod, New post, Edit profile, Habit, Pick snaps, Send to | One sheet layout; the button is always in the same place |
| **T5 `StageScreen`**: close bar + centred figure + stat cards + pinned big button | Pod tree, Pair tree, Onboarding steps | Merges the two copied tree screens; Onboarding is already this shape |
| **T6 `MediaScreen`**: black, overlay top bar, bottom caption/action | Camera, Snap, Story, Day | Shared overlay buttons and pills instead of hand-made rgba discs |

Sign-in can be T5 without a close button.

## 5. Shared parts to add or start using

| Part | Replaces |
|---|---|
| `Screen` (safe area + background + side padding) | Per-screen padding numbers |
| `Header` variants: `back`, `close`, `overlay` (transparent, for media) | Tree bar ×2, Profile bar, Onboarding `TopBar`, SnapFrame disc |
| `TextField` (label, hint, error) | 6 input copies |
| `ListRow` (leading icon/avatar, title, detail, trailing chevron/check/chip) | PodRow, PodmateRow, ActionRow, PodChoice, comment row |
| `Section` (overline label + content, one gap) | gap 6 vs 8, ad-hoc headings |
| `Chip` (extend with `size` and an `onPress`) | 4+ inline pills |
| `ScreenState` (loading / empty / error, built on `EmptyState`) | Blank views, grey sentences, missing error states |
| `Segmented` (use it) | Start a pod's own switch |

## 6. Tokens to add

- **Spacing:** `space = { xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32 }`, plus **one** side padding (`gutter`).
- **Radii:** use the existing tokens, adding `field`. Pick one value each for control (buttons and inputs, one number), card, sheet and pill.
- **Brand green:** one `brand` token used by heroes and accents, so Home, Onboarding and the rest agree.
- **Overlay colours:** for example `scrim = rgba(0,0,0,.5)` and `onMedia = #fff` for the media screens.
- **Type:** add a `label` variant (15/600, the most common hand-made size) so screens stop writing raw `fontSize`.

## 7. Decisions needed before building

1. Which **top-bar style** is standard (small `Header`, large title, or hero on tab pages)?
2. Which **green** is the brand: `#00AB5A` (Onboarding), `#46A862` (Home), or `#7BD64B` (current token)?
3. **Side padding:** 16 or 20?
4. Where the **primary button** goes in sheets: pinned to the bottom, or at the end of the content?
5. **Order of work:** tokens and parts first, then screens template by template (one PR each), or everything in one PR?
