@AGENTS.md

## Project State

Phase 1 ✅ — Next.js 15/16 foundation, Supabase client, dependencies installed
Phase 2 ✅ — Design system tokens (Tailwind + globals.css), Supabase SQL schema migrated (2 migrations run manually in Supabase dashboard)
Phase 2 Step 4 ✅ — Auth fully implemented (see below)
Phase 3 Part 1 ✅ — Onboarding flow implemented (see below)
Vercel ✅ — Deployed and connected, env variables added (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Auth Implementation (Phase 2 Step 4)

### Files created / modified
| File | Status | Purpose |
|------|--------|---------|
| `lib/supabase/client.ts` | existing ✅ | Browser Supabase client (createBrowserClient) |
| `lib/supabase/server.ts` | existing ✅ | Server Supabase client (createServerClient + cookies) |
| `lib/supabase/middleware.ts` | existing ✅ | updateSession helper used by middleware |
| `middleware.ts` | updated | Protects /dashboard /onboarding /workout; redirects auth users from /login /signup → /dashboard |
| `app/(auth)/layout.tsx` | existing ✅ | Full-screen dark layout with AGAIN wordmark |
| `app/(auth)/login/page.tsx` | existing ✅ | Email/password + magic-link sign-in |
| `app/(auth)/signup/page.tsx` | existing ✅ | Email/password sign-up |
| `app/(auth)/actions.ts` | updated | login checks onboarding_complete → /onboarding or /dashboard; signup → /onboarding |
| `app/auth/callback/route.ts` | new | Handles magic-link / OAuth PKCE code exchange |
| `app/page.tsx` | updated | Auth-aware redirect: authed → /dashboard, unauthed → /login |
| `app/dashboard/page.tsx` | new | Protected placeholder ("Welcome back") |
| `app/onboarding/page.tsx` | new | Multi-step onboarding flow (Phase 3 Part 1) |

### Route protection logic
- Unauthenticated → /dashboard, /onboarding, /workout all redirect to /login
- Authenticated → /login, /signup redirect to /dashboard
- Login action: after signInWithPassword, checks `users.onboarding_complete`; sends to /onboarding if false, else /dashboard

## Onboarding Flow (Phase 3 Part 1)

### Files created
| File | Purpose |
|------|---------|
| `app/onboarding/page.tsx` | 5-step client component with useTransition for server action submission |
| `app/onboarding/actions.ts` | Server action: inserts into `onboarding` table, sets `users.onboarding_complete = true`, redirects → /dashboard |

### Steps
| Step | Field | Options |
|------|-------|---------|
| 1 | `fitness_level` | never / rusty / active |
| 2 | `primary_goal` | rebuild_muscle / lose_fat / feel_better / energy |
| 3 | `available_time` | 15 / 30 / 45 / 60 min |
| 4 | `equipment` | none / dumbbells / resistance_bands / pull_up_bar (multi-select) |
| 5 | `schedule_days` | Mon–Sun day toggles (multi-select, int[] 0–6) |

### UI patterns
- Full-screen dark layout, AGAIN wordmark, animated progress bar
- Selection cards with accent border when chosen, checkmark indicator
- Radio-style (steps 1–3) and multi-select (steps 4–5)
- Back/Next navigation; "Let's go →" on final step with `isPending` loading state

### What's next — Phase 3 (remaining)
- Build dashboard (today's workout card, streak, weekly stats)
- Build workout screens (exercise list, active workout tracking, completion + mood)
