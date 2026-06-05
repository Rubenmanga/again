'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveWorkoutHistoryAction(params: {
  workoutId: string
  userId: string
  startedAt: string
  completedAt: string
  durationActualMinutes: number
  exercisesCompleted: number
  energyMode?: string
  intensityActual?: number
  moodAfter?: number
}): Promise<void> {
  const supabase = await createClient()

  await supabase.from('workout_history').insert({
    user_id: params.userId,
    workout_id: params.workoutId,
    started_at: params.startedAt,
    completed_at: params.completedAt,
    duration_actual_minutes: params.durationActualMinutes,
    exercises_completed: params.exercisesCompleted,
    ...(params.energyMode && { energy_mode: params.energyMode }),
    ...(params.intensityActual && { intensity_actual: params.intensityActual }),
    ...(params.moodAfter && { mood_after: params.moodAfter }),
  })
}
