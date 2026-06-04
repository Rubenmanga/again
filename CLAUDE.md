@AGENTS.md

## Project State

Phase 1 ✅ — Next.js 15/16 foundation, Supabase client, dependencies installed
Phase 2 ✅ — Design system tokens (Tailwind + globals.css), Supabase SQL schema migrated (2 migrations run manually in Supabase dashboard)
Phase 2 Step 4 ✅ — Auth fully implemented (see below)
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
| `app/onboarding/page.tsx` | new | Protected placeholder ("Let's get to know you") |

### Route protection logic
- Unauthenticated → /dashboard, /onboarding, /workout all redirect to /login
- Authenticated → /login, /signup redirect to /dashboard
- Login action: after signInWithPassword, checks `users.onboarding_complete`; sends to /onboarding if false, else /dashboard

### What's next — Phase 3
- Build onboarding flow (multi-step form, writes to `onboarding` table, sets `onboarding_complete = true`)
- Build dashboard (today's workout card, streak, stats)
- Build workout screens
