'use server'

import { createClient } from '@/lib/supabase/server'

export async function upsertWorkoutSession(params: {
  workoutId: string
  currentExerciseIndex: number
  completed: boolean
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('workout_sessions')
    .upsert(
      {
        user_id: user.id,
        workout_id: params.workoutId,
        current_exercise_index: params.currentExerciseIndex,
        completed: params.completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,workout_id' }
    )
}

export async function getWorkoutSession(workoutId: string): Promise<{ current_exercise_index: number } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workout_sessions')
    .select('current_exercise_index')
    .eq('user_id', user.id)
    .eq('workout_id', workoutId)
    .eq('completed', false)
    .maybeSingle()
  return data ?? null
}
