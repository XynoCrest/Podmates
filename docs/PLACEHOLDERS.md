# Placeholders: what's fake or local-only right now

| Thing | Now | For production |
|---|---|---|
| Seed photos | `picsum.photos` URLs (random images, need network) | Real uploads only |
| Snap storage | **Public** bucket with unguessable paths | Private bucket + signed URLs (`createSignedUrls`) and an RLS policy that checks pod membership |
| Reminders | Local notifications scheduled on the device | Add server push (Expo push / APNs) for "your podmate snapped" and "window closes in 5 min". Push needs a development build, not Expo Go |
| Auth | Email + password, no confirmation, demo accounts | Sign in with Apple, email confirmation on |
| Demo tools | `/v1/dev/pods/:id/open-window`, `/end-day`, `sign-in?demo=` | Mounted only when `APP_ENV=local`; nothing to do |
| Explore scores | Seed adds a bonus to look busy | Real votes only |
| Hosting | Everything local (Docker + Simulator) | Supabase project + a container host for `apps/api` (Dockerfile ready) + EAS builds |
