import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkoutSession from './WorkoutSession'
import type { Exercise } from '@/lib/workout-engine'

export type WorkoutExercise = Exercise & {
  easier_alternative: Exercise | null
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workout }, { data: onboarding }] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, title, duration_minutes, exercise_ids')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('onboarding')
      .select('fitness_level, equipment')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!workout) redirect('/dashboard')

  const exerciseIds = workout.exercise_ids as string[]

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .in('id', exerciseIds)

  const alternativeIds = (exercises ?? [])
    .map((e) => e.easier_alternative_id)
    .filter((id): id is string => id !== null)

  let alternativesMap: Record<string, Exercise> = {}
  if (alternativeIds.length > 0) {
    const { data: alts } = await supabase
      .from('exercises')
      .select('*')
      .in('id', alternativeIds)
    alternativesMap = Object.fromEntries((alts ?? []).map((a) => [a.id, a as Exercise]))
  }

  const exercisesWithAlts: WorkoutExercise[] = (exercises ?? []).map((e) => ({
    ...(e as Exercise),
    easier_alternative: e.easier_alternative_id ? (alternativesMap[e.easier_alternative_id] ?? null) : null,
  }))

  const ordered = exerciseIds
    .map((eid) => exercisesWithAlts.find((e) => e.id === eid))
    .filter((e): e is WorkoutExercise => e !== undefined)

  const fitnessLevel = (onboarding?.fitness_level ?? 'never') as 'never' | 'rusty' | 'active'
  const equipment = (onboarding?.equipment as string[] | null) ?? []

  return (
    <WorkoutSession
      workoutId={workout.id}
      title={workout.title}
      durationMinutes={workout.duration_minutes}
      exercises={ordered}
      userId={user.id}
      fitnessLevel={fitnessLevel}
      equipment={equipment}
    />
  )
}
