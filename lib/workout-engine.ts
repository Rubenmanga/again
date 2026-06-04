export type Exercise = {
  id: string
  name: string
  muscle_groups: string[]
  category: string
  equipment_required: string
  difficulty: number
  sets_default: number | null
  reps_default: number | null
  duration_seconds: number | null
  instructions: string
  coaching_cue: string
  easier_alternative_id: string | null
}

export type GenerateWorkoutInput = {
  userId: string
  fitnessLevel: 'never' | 'rusty' | 'active'
  availableTime: 15 | 30 | 45 | 60
  equipment: string[]
  recentExerciseIds: string[]
  exercises: Exercise[]
}

export type GeneratedWorkout = {
  title: string
  durationMinutes: number
  exercises: Exercise[]
}

type SlotType = 'lower_body' | 'upper_body_push' | 'upper_body_pull' | 'core' | 'cardio' | 'mobility'

const PUSH_MUSCLES = new Set([
  'pecho', 'tríceps', 'hombros', 'pecho superior', 'hombros laterales', 'hombros anteriores',
])
const PULL_MUSCLES = new Set([
  'espalda', 'bíceps', 'romboides', 'dorsal', 'hombros posteriores', 'braquial',
])
const STAPLE_NAMES = new Set(['Flexiones normales', 'Sentadilla', 'Plancha frontal', 'Puente de glúteo'])

const SLOT_PLANS: Record<15 | 30 | 45 | 60, SlotType[]> = {
  15: ['lower_body', 'upper_body_push', 'upper_body_pull', 'cardio'],
  30: ['lower_body', 'lower_body', 'upper_body_push', 'upper_body_pull', 'core', 'cardio'],
  45: [
    'lower_body', 'lower_body',
    'upper_body_push', 'upper_body_push',
    'upper_body_pull', 'upper_body_pull',
    'core', 'core',
    'mobility',
  ],
  60: [
    'lower_body', 'lower_body', 'lower_body',
    'upper_body_push', 'upper_body_push', 'upper_body_push',
    'upper_body_pull', 'upper_body_pull',
    'core', 'core',
    'cardio',
    'mobility',
  ],
}

const FALLBACKS: Partial<Record<SlotType, SlotType>> = {
  upper_body_pull: 'core',
  cardio: 'mobility',
}

function isPush(e: Exercise): boolean {
  return e.category === 'upper_body' && e.muscle_groups.some((m) => PUSH_MUSCLES.has(m))
}

function isPull(e: Exercise): boolean {
  return e.category === 'upper_body' && e.muscle_groups.some((m) => PULL_MUSCLES.has(m))
}

function getPool(exercises: Exercise[], slot: SlotType): Exercise[] {
  switch (slot) {
    case 'lower_body': return exercises.filter((e) => e.category === 'lower_body')
    case 'upper_body_push': return exercises.filter(isPush)
    case 'upper_body_pull': return exercises.filter(isPull)
    case 'core': return exercises.filter((e) => e.category === 'core')
    case 'cardio': return exercises.filter((e) => e.category === 'cardio' || e.category === 'full_body')
    case 'mobility': return exercises.filter((e) => e.category === 'mobility')
  }
}

function pickBestFrom(candidates: Exercise[], recentIds: Set<string>): Exercise {
  const scored = candidates.map((e) => ({
    exercise: e,
    score: STAPLE_NAMES.has(e.name) ? 0 : recentIds.has(e.id) ? -1 : 0,
  }))
  const maxScore = Math.max(...scored.map((s) => s.score))
  const best = scored.filter((s) => s.score === maxScore)
  return best[Math.floor(Math.random() * best.length)].exercise
}

function pickSlot(
  exercises: Exercise[],
  slot: SlotType,
  recentIds: Set<string>,
  selected: Set<string>,
): Exercise | null {
  const pool = getPool(exercises, slot).filter((e) => !selected.has(e.id))
  if (pool.length > 0) return pickBestFrom(pool, recentIds)

  const fallbackSlot = FALLBACKS[slot]
  if (fallbackSlot) {
    const fallback = getPool(exercises, fallbackSlot).filter((e) => !selected.has(e.id))
    if (fallback.length > 0) return pickBestFrom(fallback, recentIds)
  }

  return null
}

function buildTitle(exercises: Exercise[], availableTime: number): string {
  const total = exercises.length
  if (total === 0) return 'Entrenamiento'

  const lowerCount = exercises.filter((e) => e.category === 'lower_body').length
  const upperCount = exercises.filter((e) => e.category === 'upper_body').length
  const coreCount = exercises.filter((e) => e.category === 'core').length

  let title: string
  if (lowerCount > total / 2) {
    title = 'Tren inferior'
  } else if (upperCount > total / 2) {
    title = 'Tren superior'
  } else if (coreCount >= 3) {
    title = 'Core y estabilidad'
  } else {
    title = 'Cuerpo completo'
  }

  if (availableTime === 15) title = `Sesión rápida — ${title}`
  return title
}

export function generateWorkout(input: GenerateWorkoutInput): GeneratedWorkout {
  const { availableTime, recentExerciseIds, exercises } = input
  const recentIds = new Set(recentExerciseIds)
  const slots = SLOT_PLANS[availableTime]
  const selected = new Set<string>()
  const result: Exercise[] = []

  for (const slot of slots) {
    const exercise = pickSlot(exercises, slot, recentIds, selected)
    if (exercise) {
      result.push(exercise)
      selected.add(exercise.id)
    }
  }

  return {
    title: buildTitle(result, availableTime),
    durationMinutes: availableTime,
    exercises: result,
  }
}
