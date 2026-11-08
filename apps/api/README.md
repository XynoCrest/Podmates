# @podmates/api

Express 5 API plus the in-process settlement worker.

| Route | Auth | What |
|---|---|---|
| `GET /health` | none | liveness |
| `POST /v1/pods/:id/replant` | member | plant a fresh tree after it died |
| `POST /v1/dev/pods/:id/open-window` | member, **local only** | move the snap window so it's open now |
| `POST /v1/dev/pods/:id/end-day` | member, **local only** | close today and settle it now |

The worker (`src/worker/loop.ts`) settles every ended pod-day each `SETTLE_POLL_MS`, using
`@podmates/tree-engine`. `npm run settle` (repo root) does a one-off run.

```bash
npm run dev:api                 # from the repo root, with reload
docker compose up --build       # same thing in a container (repo root)
```
