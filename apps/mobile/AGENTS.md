# apps/mobile: agent notes

Project rules live in the root [AGENTS.md](../../AGENTS.md). Mobile-specific:

- **Must keep running in Expo Go** (no custom native modules), so iOS testing needs no Apple
  developer account. Check `node_modules/expo/bundledNativeModules.json` before adding a native dep.
- Data: Supabase directly (`src/lib/supabase.ts`, RLS applies) for nearly everything. `src/lib/api.ts`
  is the single chokepoint for calls to `apps/api` (replant, local demo tools).
- Query keys only from `src/lib/keys.ts`. Live updates come through `useRealtimeInvalidate` (`src/lib/realtime.ts`).
- API responses are parsed with schemas from `@podmates/shared`.
- Styling: plain `style` objects with tokens from `@podmates/ui-tokens` (no NativeWind: its `className`
  typings don't work with RN 0.88's strict TypeScript API). Text styles are the variants in `components/ui/Text.tsx`.
- Design system: see docs/DESIGN.md. Surfaces are `Tile`s, statuses are `PlantLabel`s, type is Figtree via
  `Text` (weights 400-600, sentence case). No emoji in the UI, and no colours outside the tokens.
- Motion: press feedback on touch-down (`Tile`/`Button` sink into their lip, `PressableScale` 0.97). No looping animations. Tabs never animate. Haptics via
  `src/lib/haptics.ts`, one per user action. Respect Reduce Motion.
- The tab bar is `NativeTabs` from `expo-router/native-tabs`. Render `Trigger.Badge` conditionally:
  on SDK 58 its `hidden` prop no longer hides it. `_layout.web.tsx` is the browser fallback.
- `Stack.Protected` takes `redirectTo` (SDK 58: a failed guard renders a redirect).
- formSheet routes use a `ScrollView` as their root (see docs/INVARIANTS.md #7).
- Back/close buttons use `goBack()` from `src/lib/nav.ts`, because screens opened from a notification have no history.
- Dark only for now (`userInterfaceStyle: dark`).

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
