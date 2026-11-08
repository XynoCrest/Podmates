# CLAUDE.md

Guidance for Claude Code in this repository. The full rules are in **[AGENTS.md](AGENTS.md)**. Read it first.

Quick reference:

```bash
npm install && npm run db:start && npm run env:local && npm run db:reset
npm run dev:api                       # API + settlement worker on :4100
cd apps/mobile && npx expo start      # Expo; press i for the iOS Simulator
npm run typecheck && npm test         # must stay green
npm run smoke                         # end-to-end check against the running stack
```

- Tree numbers are computed only in `packages/tree-engine`. On-time is decided only by the DB trigger.
- Expo APIs change every SDK. Check `apps/mobile/AGENTS.md` and the installed package's types
  before using an Expo/React Native API from memory.
- Never run EAS commands or push migrations to hosted databases.
