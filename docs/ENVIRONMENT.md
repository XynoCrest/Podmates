# Environment

| File | Written by | Keys |
|---|---|---|
| `apps/api/.env.local` | `npm run env:local` | `APP_ENV`, `PORT` (4100), `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RUN_WORKER`, `SETTLE_POLL_MS`, `CORS_ORIGINS`, `LOG_LEVEL` |
| `apps/mobile/.env.local` | `npm run env:local` | `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL` |

Both are validated with zod at startup. The app shows a setup screen instead of falling back to defaults.

**Ports:** Supabase uses 553xx (API 55321, DB 55322, Studio 55323, Mailpit 55324). That keeps it
off the 543xx ports TariffsCANner uses, so both stacks can run at once. The API runs on 4100 and Metro on 8081.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Podmates isn't configured" screen | `npm run env:local`, then `npx expo start -c` |
| Sign-in says invalid credentials | The DB was reset without the seed, or the stack is down → `npm run db:reset` |
| Trees all at 100 HP, no history | Settlement hasn't run → `npm run settle`, or start the API |
| "Can't reach the Podmates API" on demo tools | `npm run dev:api` |
| Physical phone can't load data | `npm run env:local -- --lan`, restart Expo, same Wi-Fi |
| No reminder notifications | Allow notifications for Expo Go in iOS Settings |
| Port already in use | `npm run db:stop` in the other project, or change ports in `supabase/config.toml` |
