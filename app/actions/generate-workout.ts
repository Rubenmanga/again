'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateWorkout, type Exercise } from '@/lib/workout-engine'

export async function generateWorkoutAction(durationMinutes: 15 | 30 | 45 | 60): Promise<{ error: string } | undefined> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: onboarding } = await supabase
    .from('onboarding')
    .select('fitness_level, equipment')
    .eq('user_id', user.id)
    .single()

  if (!onboarding) redirect('/onboarding')

  const { data: recentHistory } = await supabase
    .from('workout_history')
    .select('workout_id, workouts(exercise_ids)')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(3)

  const recentExerciseIds: string[] = (recentHistory ?? []).flatMap(
    (row: any) => (row.workouts as any)?.exercise_ids ?? [],
  )

  const fitnessLevel = onboarding.fitness_level as 'never' | 'rusty' | 'active'
  const availableTime = durationMinutes
  const maxDifficulty = ({ never: 2, rusty: 3, active: 4 } as const)[fitnessLevel]
  const equipmentFilter = onboarding.equipment.includes('resistance_bands')
    ? ['none', 'resistance_bands']
    : ['none']

  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('*')
    .lte('difficulty', maxDifficulty)
    .in('equipment_required', equipmentFilter)

  if (exercisesError || !exercises?.length) {
    return { error: 'No pudimos generar el entrenamiento. Inténtalo de nuevo.' }
  }

  const workout = generateWorkout({
    userId: user.id,
    fitnessLevel,
    availableTime,
    equipment: onboarding.equipment as string[],
    recentExerciseIds,
    exercises: exercises as Exercise[],
  })

  if (!workout.exercises.length) {
    return { error: 'No pudimos generar el entrenamiento. Inténtalo de nuevo.' }
  }

  const intensity = ({ never: 1, rusty: 2, active: 3 } as const)[fitnessLevel]

  const { data: newWorkout, error: insertError } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      title: workout.title,
      generated_by: 'rule_engine',
      duration_minutes: workout.durationMinutes,
      exercise_ids: workout.exercises.map((e) => e.id),
      intensity,
    })
    .select('id')
    .single()

  if (insertError || !newWorkout) {
    return { error: 'No pudimos guardar el entrenamiento. Inténtalo de nuevo.' }
  }

  redirect(`/workout/${newWorkout.id}`)
}
