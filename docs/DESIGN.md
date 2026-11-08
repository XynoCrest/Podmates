# Design

Light, following the **Podmates app-screens PDF**: an off-white canvas, white sheets, soft grey
controls and one green brand colour, so snaps and the tree carry the colour. Colour is reserved for
meaning: **leaf** (green) = brand, tree, health, done; **energy** = ⚡; **star** = ⭐;
**flame** (amber) = 🔥 streaks, open snap window and "not yet" warnings; **danger** = dead tree.
Tokens live in `packages/ui-tokens`. Type is the system font (SF Pro) with size-specific tracking
(`components/ui/Text.tsx`).

**Icons** are the Podmates line icons (24×24, 2px round strokes) in `components/ui/svgIcons.ts`,
with SF Symbols only where no line icon exists (bolt, star, arrows, photo library). Habits use a line
icon for walking, hydration and sleep, else their SF Symbol from the database (`HabitIcon`).

**Tree art** comes from the design files `tree-<n>-<stage>[-resting].svg`, rebuilt from their geometry in
`features/tree/treeSvgs.ts`. The five drawings map to the engine's six stages: Seed, Sprout, Sapling,
Young tree, then Grown tree and Ancient tree both use the full tree. A dead tree shows the grey
"resting" drawing. The drawing no longer tints with health; health shows in the bar, the pod disc
tint (green / amber / grey) and the text.

| Screen | What we kept from the PDF |
|---|---|
| Sign in | Small tree, "Podmates", the one-line promise, labelled outlined fields, green Sign in, demo-account name pills under a divider. |
| Tab bar | Flat white bar with a top border; icon only, green when active with a dot under it. Four tabs (Pods, Explore, Camera, Profile); Camera hides the bar. |
| Pods (home) | Big "Pods" title, habit pills (solid green when selected), "Your snap" + podmates' story circles (green ring = unwatched), chat rows with a tree disc, bold author, and a green time + dot while your window is open. |
| Chat | Back · name · green "Snap by 7:15 AM · 20 min window", tree at the right. Snap cards with "✓ On time · N min before close", grey bubbles for others, green for you, avatars with a check when that person snapped today, and an amber pill naming who hasn't snapped. Green camera button left of an outlined field. |
| Tree | Result pill, the tree, stage name, health with last night's change, "How today scores" (the live row highlighted), and who snapped today. Kept: the Snap now / Replant button and local Demo tools. |
| Camera | Close · pod name · amber per-second countdown; framed preview with corner brackets and "Live camera only"; green shutter between flip and flash. Real phones shoot live only; the Simulator keeps library + demo photo. |
| Send to | Snap preview with "On time · N min before close" and what it earns, optional caption, "Your pods" with tree discs and square checkboxes, "Send to N →". No Friends section (snaps go to pods only). |
| Profile | Avatar with green ring, name, @username, settings icon (Edit, Share, Join, New pod, Sign out); Energy / Stars / Streak; one icon tab per habit; "N snaps you picked" + Pick snaps; 3:4 grid. |
| Pick snaps | Sheet with Cancel · "Pick snaps / N of M chosen" · Done. Choices save only on Done. |
| Explore | "Explore" + new post, community search, Hot / New / Top pills, your communities, then posts from every community with a vote column. |
| Community · Post · New post | Community header with Join/Joined pill and description; post with votes and a flat comment list; New post sheet with community picker, title and optional body. |
| Story | Progress bars, author and "pod · time", close on the right, "✓ On time · earned ⚡10". |

Left out on purpose because the backend doesn't support them (they would look like they work but
wouldn't): sending snaps to friends, threaded replies and comment votes, "online" and "new today"
counts, story replies, and adding a snap to a post.

Motion and feedback follow Apple's guidance: press feedback on touch-down (`PressableScale`, 0.97),
one haptic per action (`lib/haptics.ts`), native sheets, and the tree's breathing animation is turned
off under Reduce Motion.
