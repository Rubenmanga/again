import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isAppRoute = pathname.startsWith('/app')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isOnboardingRoute = pathname === '/onboarding'

  // Unauthenticated user trying to access protected routes
  if ((isAppRoute || isOnboardingRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated user: check onboarding status for relevant routes
  if (user && (isAuthRoute || isAppRoute)) {
    const { data } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    const onboardingComplete = data?.onboarding_complete ?? false

    if (!onboardingComplete) {
      // Not on onboarding yet → send them there
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Onboarding done but still on an auth page → go to app
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/app/today', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
