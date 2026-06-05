'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateOnboardingField(
  field: 'fitness_level' | 'primary_goal' | 'equipment',
  value: string | string[]
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('onboarding')
    .update({ [field]: value })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
