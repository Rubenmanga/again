@AGENTS.md

## Project State

Phase 1 ✅ — Next.js 16 foundation, Supabase client, dependencies installed
Phase 2 ✅ — Design system tokens (Tailwind v4 + globals.css), Supabase SQL schema migrated
Phase 2 Step 4 ✅ — Auth fully implemented
Phase 3 Part 1 ✅ — Onboarding flow implemented
Phase 3 Part 2 ✅ — Dashboard with greeting, motivational messages, workout card, weekly streak grid
Phase 3 Part 3 ✅ — Exercise seed (55 exercises in Spanish, `003_exercise_seed.sql` — apply manually in Supabase SQL Editor)
Phase 3 Part 4 ✅ — Full UI translated to Spanish (tuteo, calm tone)
Phase 4 Part 1 ✅ — Workout engine (rule-based generator) + generate-workout server action + wired Empezar button
Phase 4 Part 2 ✅ — Workout session screen (`/workout/[id]`) — intro, exercise, rest, finish states
Vercel ✅ — Deployed and connected (https://again-ten-zeta.vercel.app)

## Key decisions
- **Email confirmation disabled** in Supabase — personal app, signup logs in immediately
- **No NEXT_PUBLIC_SITE_URL** needed — env var not required
- **Language**: all UI copy is Spanish (tuteo, calm tone). No English visible text.
- **Push/pull split**: no DB column; inferred from `muscle_groups` overlap with predefined sets at engine level
- **Easier alternatives**: fetched in two queries (main exercises + alternatives) to avoid PostgREST self-join ambiguity

## Auth (Phase 2 Step 4)

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser Supabase client (createBrowserClient) |
| `lib/supabase/server.ts` | Server Supabase client (createServerClient + cookies) |
| `lib/supabase/middleware.ts` | updateSession helper |
| `middleware.ts` | Protects /dashboard /onboarding /workout; redirects auth users from /login /signup → /dashboard |
| `app/(auth)/layout.tsx` | Full-screen dark layout with AGAIN wordmark |
| `app/(auth)/login/page.tsx` | Email/password + magic-link sign-in |
| `app/(auth)/signup/page.tsx` | Email/password sign-up |
| `app/(auth)/actions.ts` | login checks onboarding_complete → /onboarding or /dashboard; signup → /onboarding |
| `app/auth/callback/route.ts` | Magic-link / OAuth PKCE code exchange; checks onboarding_complete post-login |
| `app/page.tsx` | Auth-aware redirect: authed → /dashboard, unauthed → /login |
| `app/dashboard/page.tsx` | Protected dashboard with greeting, motivational messages, workout card, weekly streak |

### Route protection
- Unauthenticated → /dashboard, /onboarding, /workout redirect to /login
- Authenticated → /login, /signup redirect to /dashboard
- Login: checks `users.onboarding_complete`; → /onboarding if false, → /dashboard if true

## Onboarding Flow (Phase 3 Part 1)

| File | Purpose |
|------|---------|
| `app/onboarding/page.tsx` | 5-step client component (useTransition for server action) |
| `app/onboarding/actions.ts` | Inserts into `onboarding` table, sets `users.onboarding_complete = true`, redirects → /dashboard |

| Step | Field | Options |
|------|-------|---------|
| 1 | `fitness_level` | never / rusty / active |
| 2 | `primary_goal` | rebuild_muscle / lose_fat / feel_better / energy |
| 3 | `available_time` | 15 / 30 / 45 / 60 min |
| 4 | `equipment` | none / dumbbells / resistance_bands / pull_up_bar (multi-select) |
| 5 | `schedule_days` | Lu–Do toggles (int[] 0–6) |

## Dashboard (Phase 3 Part 2)

| File | Purpose |
|------|---------|
| `app/dashboard/page.tsx` | Greeting by time of day, daily motivational message, workout card (or rest day), weekly streak grid |
| `app/dashboard/BottomNav.tsx` | Fixed bottom nav: Hoy / Progreso / Perfil |
| `app/dashboard/StartWorkoutButton.tsx` | Client component — calls generate-workout action, shows loading/error state |

## Exercise Library (Phase 3 Part 3)

| File | Status |
|------|--------|
| `supabase/migrations/003_exercise_seed.sql` | **Pending manual apply in Supabase SQL Editor** |

55 exercises in Spanish covering:
- Bodyweight: empuje, piernas, core, cardio, movilidad
- Elástico de tubo: tirón/bíceps/espalda, empuje/tríceps/hombros, piernas/glúteos, core

Equipment values used: `none` (bodyweight) · `resistance_bands` (elástico de tubo con asas)

## Workout Engine (Phase 4 Part 1)

| File | Purpose |
|------|---------|
| `lib/workout-engine.ts` | Pure rule-based generator — slot plans per duration, push/pull split via muscle_groups, recency scoring, staple-exercise exemption, fallback slots, title building |
| `app/actions/generate-workout.ts` | Server action: reads onboarding + last-3 workouts history, calls engine, inserts `workouts` row, redirects to `/workout/[id]` |
| `app/actions/save-workout-history.ts` | Server action: inserts one `workout_history` row on session completion |

### Slot plans

| Duration | Exercises | Slots |
|----------|-----------|-------|
| 15 min | 4 | 1 lower, 1 push, 1 pull→core fallback, 1 cardio→mobility fallback |
| 30 min | 6 | 2 lower, 1 push, 1 pull, 1 core, 1 cardio |
| 45 min | 9 | 2 lower, 2 push, 2 pull, 2 core, 1 mobility |
| 60 min | 12 | 3 lower, 3 push, 2 pull, 2 core, 1 cardio, 1 mobility |

### Difficulty caps
- `never` → max difficulty 2
- `rusty` → max difficulty 3
- `active` → max difficulty 4

### Equipment filter
- Only `none` selected → `WHERE equipment_required = 'none'`
- `resistance_bands` included → `WHERE equipment_required IN ('none', 'resistance_bands')`

### Rotation logic
- Exercises in last-3 completed workouts get score −1
- Staple exercises (Flexiones normales, Sentadilla, Plancha frontal, Puente de glúteo) never deprioritized
- Tie-breaking: random

## Workout Session Screen (Phase 4 Part 2)

| File | Purpose |
|------|---------|
| `app/workout/[id]/page.tsx` | Server component — auth guard, fetches workout + exercises + easier alternatives (two queries) |
| `app/workout/[id]/WorkoutSession.tsx` | Client component with `useReducer` state machine |

### Session state machine
```
INTRO (2 s auto-advance)
  → EXERCISE (reps: tap per set; timed: countdown → tap to advance)
    → REST (20 s countdown, skippable)
      → EXERCISE (next)
        → ... → FINISH
```

- Exit modal on X tap — does NOT save to `workout_history`
- Easier alternative: replaces current exercise in-place, resets sets/timer
- Saves to `workout_history` on FINISH (started_at recorded when INTRO ends)

## Supabase migrations

| File | Status |
|------|--------|
| `supabase/migrations/001_initial_schema.sql` | Applied manually in dashboard |
| `supabase/migrations/002_user_profile_trigger.sql` | Applied — creates public.users row on auth.users insert |
| `supabase/migrations/003_exercise_seed.sql` | **Pending** — run manually in Supabase SQL Editor |

## What's next — Phase 4 (remaining)
- Progress page: weekly stats, streak, consistency chart
- Profile page: display name, schedule edit, sign out
