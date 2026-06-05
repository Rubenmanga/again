'use server'

import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/workout-engine'

type SlotType = 'lower_body' | 'upper_body_push' | 'upper_body_pull' | 'core' | 'cardio' | 'mobility' | 'full_body'

const PUSH_MUSCLES = new Set(['pecho', 'tríceps', 'hombros', 'pecho superior', 'hombros laterales', 'hombros anteriores'])
const PULL_MUSCLES = new Set(['espalda', 'bíceps', 'romboides', 'dorsal', 'hombros posteriores', 'braquial'])

function getSlot(exercise: Exercise): SlotType {
  if (exercise.category === 'lower_body') return 'lower_body'
  if (exercise.category === 'core') return 'core'
  if (exercise.category === 'cardio') return 'cardio'
  if (exercise.category === 'mobility') return 'mobility'
  if (exercise.category === 'full_body') return 'full_body'
  if (exercise.category === 'upper_body') {
    if (exercise.muscle_groups.some(m => PUSH_MUSCLES.has(m))) return 'upper_body_push'
    if (exercise.muscle_groups.some(m => PULL_MUSCLES.has(m))) return 'upper_body_pull'
  }
  return 'core'
}

function matchesSlot(ex: Exercise, slot: SlotType): boolean {
  if (slot === 'lower_body') return ex.category === 'lower_body'
  if (slot === 'core') return ex.category === 'core'
  if (slot === 'cardio') return ex.category === 'cardio' || ex.category === 'full_body'
  if (slot === 'mobility') return ex.category === 'mobility'
  if (slot === 'full_body') return ex.category === 'full_body' || ex.category === 'cardio'
  if (slot === 'upper_body_push') return ex.category === 'upper_body' && ex.muscle_groups.some(m => PUSH_MUSCLES.has(m))
  if (slot === 'upper_body_pull') return ex.category === 'upper_body' && ex.muscle_groups.some(m => PULL_MUSCLES.has(m))
  return false
}

export async function getExerciseAlternatives(
  currentExerciseId: string,
  excludeIds: string[],
  maxDifficulty: number,
  equipmentFilter: string[]
): Promise<Exercise[]> {
  const supabase = await createClient()

  const { data: currentEx } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', currentExerciseId)
    .single()

  if (!currentEx) return []

  const slot = getSlot(currentEx as Exercise)

  const { data: candidates } = await supabase
    .from('exercises')
    .select('*')
    .lte('difficulty', maxDifficulty)
    .in('equipment_required', equipmentFilter)

  if (!candidates) return []

  return (candidates as Exercise[])
    .filter(ex =>
      ex.id !== currentExerciseId &&
      !excludeIds.includes(ex.id) &&
      matchesSlot(ex, slot)
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
}
