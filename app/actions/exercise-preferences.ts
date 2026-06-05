'use server'

import { createClient } from '@/lib/supabase/server'

export async function markExerciseDisliked(exerciseId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('exercise_preferences')
    .upsert(
      { user_id: user.id, exercise_id: exerciseId, preference_type: 'disliked', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' }
    )
  return error ? { error: error.message } : {}
}

export async function removeExercisePreference(exerciseId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('exercise_preferences')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
  return error ? { error: error.message } : {}
}

export async function getDislikedExerciseIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('exercise_preferences')
    .select('exercise_id')
    .eq('user_id', user.id)
    .eq('preference_type', 'disliked')
  return (data ?? []).map(r => r.exercise_id)
}
