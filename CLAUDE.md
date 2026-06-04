@AGENTS.md

## Project State

Phase 1 ✅ — Next.js 16 foundation, Supabase client, dependencies installed
Phase 2 ✅ — Design system tokens (Tailwind v4 + globals.css), Supabase SQL schema migrated
Phase 2 Step 4 ✅ — Auth fully implemented
Phase 3 Part 1 ✅ — Onboarding flow implemented
Phase 3 Part 2 ✅ — Dashboard with greeting, motivational messages, workout card, weekly streak grid
Phase 3 Part 3 ✅ — Exercise seed (55 exercises in Spanish, `003_exercise_seed.sql` — apply manually in Supabase SQL Editor)
Phase 3 Part 4 ✅ — Full UI translated to Spanish (tuteo, calm tone)
Vercel ✅ — Deployed and connected (https://again-ten-zeta.vercel.app)

## Key decisions
- **Email confirmation disabled** in Supabase — personal app, signup logs in immediately
- **No NEXT_PUBLIC_SITE_URL** needed — env var not required
- **Language**: all UI copy is Spanish (tuteo, calm tone). No English visible text.

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

## Exercise Library (Phase 3 Part 3)

| File | Status |
|------|--------|
| `supabase/migrations/003_exercise_seed.sql` | **Pending manual apply in Supabase SQL Editor** |

55 exercises in Spanish covering:
- Bodyweight: empuje, piernas, core, cardio, movilidad
- Elástico de tubo: tirón/bíceps/espalda, empuje/tríceps/hombros, piernas/glúteos, core

Equipment values used: `none` (bodyweight) · `resistance_bands` (elástico de tubo con asas)

## Supabase migrations

| File | Status |
|------|--------|
| `supabase/migrations/001_initial_schema.sql` | Applied manually in dashboard |
| `supabase/migrations/002_user_profile_trigger.sql` | Applied — creates public.users row on auth.users insert |
| `supabase/migrations/003_exercise_seed.sql` | **Pending** — run manually in Supabase SQL Editor |

## What's next — Phase 4
- Workout generation: rule engine selects exercises from DB based on onboarding data
- Workout screen: exercise list → active tracking (sets/reps/timer) → completion summary + mood rating
- Progress page: weekly stats, streak, consistency chart
- Profile page: display name, schedule edit, sign out
