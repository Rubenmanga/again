'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type OnboardingData = {
  fitness_level: 'never' | 'rusty' | 'active'
  primary_goal: 'rebuild_muscle' | 'lose_fat' | 'feel_better' | 'energy'
  available_time: 15 | 30 | 45 | 60
  equipment: string[]
}

export type OnboardingState = { error?: string } | null

export async function completeOnboarding(
  data: OnboardingData
): Promise<OnboardingState> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { error } = await supabase.from('onboarding').insert({
    user_id: user.id,
    fitness_level: data.fitness_level,
    primary_goal: data.primary_goal,
    available_time: data.available_time,
    equipment: data.equipment,
    completed_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }

  await supabase
    .from('users')
    .update({ onboarding_complete: true })
    .eq('id', user.id)

  redirect('/dashboard')
}
