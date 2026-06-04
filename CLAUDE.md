@AGENTS.md

## Project State

Phase 1 ✅ — Next.js 16 foundation, Supabase client, dependencies installed
Phase 2 ✅ — Design system tokens (Tailwind v4 + globals.css), Supabase SQL schema migrated
Phase 2 Step 4 ✅ — Auth fully implemented
Phase 3 Part 1 ✅ — Onboarding flow implemented
Vercel ✅ — Deployed and connected (https://again-ten-zeta.vercel.app)

## Key decisions
- **Email confirmation disabled** in Supabase — personal app, signup logs in immediately
- **No NEXT_PUBLIC_SITE_URL** needed — env var not required

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
| `app/dashboard/page.tsx` | Protected placeholder ("Welcome back") |

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
| 5 | `schedule_days` | Mon–Sun toggles (int[] 0–6) |

## Supabase migrations

| File | Status |
|------|--------|
| `supabase/migrations/001_initial_schema.sql` | Applied manually in dashboard |
| `supabase/migrations/002_user_profile_trigger.sql` | Applied — creates public.users row on auth.users insert |

## What's next — Phase 3 (remaining)
- Dashboard: today's workout card, streak, weekly stats
- Workout screens: exercise list, active tracking, completion + mood
