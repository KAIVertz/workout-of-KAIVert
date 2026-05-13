# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build + TypeScript check
npm run lint     # ESLint
```

There are no tests. `npm run build` is the only type-safety gate — run it before committing.

## Stack

- **Next.js 16.2.2** (App Router, no Pages Router, no Vite, no Turbopack flag needed)
- **React 19**, **TypeScript 5**, **Tailwind CSS v4** (`@import "tailwindcss"` in globals.css — no config file)
- **Neon serverless Postgres** (`@neondatabase/serverless`) — `DATABASE_URL` env var, set in Vercel dashboard only (no `.env.local`)
- **Deployed**: Vercel, auto-deploy on push to `main` → `workout-silk-delta.vercel.app`

## Architecture

**Single-user app** — no auth, no multi-tenancy.

### Data flow

1. `app/page.tsx` calls `POST /api/init` on mount to ensure DB tables exist (idempotent)
2. Sessions are created via `POST /api/sessions`, logs via `POST /api/logs`
3. All state lives in React (`useState`) — no global store, no SWR/React Query
4. Logs use **optimistic updates**: UI updates immediately, then API call fires

### DB schema (created in `/api/init`)

```sql
workout_sessions(id, date TEXT, day_type TEXT, completed BOOL, duration_seconds INT, created_at)
exercise_logs(id, session_id FK→sessions, exercise_name TEXT, set_number INT, reps INT, weight_kg NUMERIC)
```

- `set_number = 0` → warmup set
- `date` is stored as local `YYYY-MM-DD` string (not UTC) — use `localDate()` from `lib/program.ts`, never `toISOString().split("T")[0]` (timezone bug)

### Key files

- `lib/program.ts` — all workout data: `DayType`, `PROGRAM` (7-day schedule), `DAY_LABEL` (colors), `getTodayType()`, `computeStreak()`, `getMissedDays()`, `localDate()`
- `lib/db.ts` — singleton Neon client
- `components/ExerciseIllustration.tsx` — inline SVG illustrations, one per `IllustrationType`
- `components/BottomNav.tsx` — exports `TopNav` (navigation is at the top, not bottom — mobile browsers hide fixed bottom elements)

### Routing

- `/` — today's workout (idle state + active workout, same page)
- `/history` — completed sessions

### Program structure (`lib/program.ts`)

7-day fixed schedule (Mon–Sun), each day has 5 exercises. Priority order: abs (daily, high volume) → chest (Mon+Thu) → arms (Tue+Thu) → legs (Wed+Sat) → rest. `IllustrationType` must match a `case` in `ExerciseIllustration.tsx` — add new cases there when adding new exercise types.
