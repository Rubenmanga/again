'use client'

import { useReducer, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorkoutHistoryAction } from '@/app/actions/save-workout-history'
import type { WorkoutExercise } from './page'

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'exercise' | 'rest' | 'finish'

type State = {
  phase: Phase
  exerciseIndex: number
  setsDone: number
  restTimeLeft: number
  exerciseTimeLeft: number
  timerDone: boolean
  completedCount: number
  showExitModal: boolean
  exercises: WorkoutExercise[]
}

type Action =
  | { type: 'ADVANCE_TO_EXERCISE' }
  | { type: 'COMPLETE_SET' }
  | { type: 'TIMED_NEXT' }
  | { type: 'EXERCISE_TICK' }
  | { type: 'REST_TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'SHOW_EXIT' }
  | { type: 'HIDE_EXIT' }
  | { type: 'REPLACE_EXERCISE'; exercise: WorkoutExercise }

// ─── Reducer ────────────────────────────────────────────────────────────────

function makeExerciseState(exercises: WorkoutExercise[], index: number) {
  const ex = exercises[index]
  return {
    exerciseIndex: index,
    setsDone: 0,
    timerDone: false,
    exerciseTimeLeft: ex?.duration_seconds ?? 0,
  }
}

function finishOrRest(
  state: State,
  nextCompletedCount: number,
): State {
  const isLast = state.exerciseIndex === state.exercises.length - 1
  if (isLast) {
    return { ...state, phase: 'finish', completedCount: nextCompletedCount }
  }
  return { ...state, phase: 'rest', restTimeLeft: 20, completedCount: nextCompletedCount }
}

function reducer(state: State, action: Action): State {
  const currentEx = state.exercises[state.exerciseIndex]
  const totalSets = currentEx?.sets_default ?? 1

  switch (action.type) {
    case 'ADVANCE_TO_EXERCISE': {
      return {
        ...state,
        phase: 'exercise',
        ...makeExerciseState(state.exercises, 0),
      }
    }

    case 'COMPLETE_SET': {
      const nextSetsDone = state.setsDone + 1
      if (nextSetsDone >= totalSets) {
        return finishOrRest(state, state.completedCount + 1)
      }
      return { ...state, setsDone: nextSetsDone }
    }

    case 'TIMED_NEXT': {
      const nextSetsDone = state.setsDone + 1
      if (nextSetsDone >= totalSets) {
        return finishOrRest(state, state.completedCount + 1)
      }
      return {
        ...state,
        setsDone: nextSetsDone,
        timerDone: false,
        exerciseTimeLeft: currentEx?.duration_seconds ?? 0,
      }
    }

    case 'EXERCISE_TICK': {
      const newTime = state.exerciseTimeLeft - 1
      if (newTime <= 0) {
        return { ...state, exerciseTimeLeft: 0, timerDone: true }
      }
      return { ...state, exerciseTimeLeft: newTime }
    }

    case 'REST_TICK': {
      const newTime = state.restTimeLeft - 1
      if (newTime <= 0) {
        const nextIndex = state.exerciseIndex + 1
        return {
          ...state,
          phase: 'exercise',
          restTimeLeft: 0,
          ...makeExerciseState(state.exercises, nextIndex),
        }
      }
      return { ...state, restTimeLeft: newTime }
    }

    case 'SKIP_REST': {
      const nextIndex = state.exerciseIndex + 1
      return {
        ...state,
        phase: 'exercise',
        restTimeLeft: 0,
        ...makeExerciseState(state.exercises, nextIndex),
      }
    }

    case 'SHOW_EXIT': return { ...state, showExitModal: true }
    case 'HIDE_EXIT': return { ...state, showExitModal: false }

    case 'REPLACE_EXERCISE': {
      const updated = [...state.exercises]
      updated[state.exerciseIndex] = action.exercise
      return {
        ...state,
        exercises: updated,
        setsDone: 0,
        timerDone: false,
        exerciseTimeLeft: action.exercise.duration_seconds ?? 0,
      }
    }

    default: return state
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

const MOTIVATIONAL = [
  'Eso es todo. Lo hiciste.',
  'Cada sesión cuenta. Esta también.',
  'Pequeño movimiento, gran constancia.',
]

export default function WorkoutSession({
  workoutId,
  title,
  durationMinutes,
  exercises,
  userId,
}: {
  workoutId: string
  title: string
  durationMinutes: number
  exercises: WorkoutExercise[]
  userId: string
}) {
  const router = useRouter()
  const startedAtRef = useRef<Date | null>(null)
  const savedRef = useRef(false)

  const [state, dispatch] = useReducer(reducer, {
    phase: 'intro',
    exerciseIndex: 0,
    setsDone: 0,
    restTimeLeft: 20,
    exerciseTimeLeft: exercises[0]?.duration_seconds ?? 0,
    timerDone: false,
    completedCount: 0,
    showExitModal: false,
    exercises,
  })

  const currentEx = state.exercises[state.exerciseIndex]
  const isTimed = (currentEx?.duration_seconds ?? null) !== null

  // INTRO → auto-advance after 2 s
  useEffect(() => {
    if (state.phase !== 'intro') return
    const t = setTimeout(() => {
      startedAtRef.current = new Date()
      dispatch({ type: 'ADVANCE_TO_EXERCISE' })
    }, 2000)
    return () => clearTimeout(t)
  }, [state.phase])

  // Exercise countdown timer
  useEffect(() => {
    if (state.phase !== 'exercise') return
    if (!isTimed || state.timerDone) return
    const t = setInterval(() => dispatch({ type: 'EXERCISE_TICK' }), 1000)
    return () => clearInterval(t)
  }, [state.phase, state.exerciseIndex, isTimed, state.timerDone])

  // Rest countdown timer
  useEffect(() => {
    if (state.phase !== 'rest') return
    const t = setInterval(() => dispatch({ type: 'REST_TICK' }), 1000)
    return () => clearInterval(t)
  }, [state.phase, state.exerciseIndex])

  // Save to DB on finish
  useEffect(() => {
    if (state.phase !== 'finish') return
    if (savedRef.current) return
    savedRef.current = true
    const now = new Date()
    const started = startedAtRef.current ?? now
    const durationActual = Math.max(1, Math.round((now.getTime() - started.getTime()) / 60000))
    saveWorkoutHistoryAction({
      workoutId,
      userId,
      startedAt: started.toISOString(),
      completedAt: now.toISOString(),
      durationActualMinutes: durationActual,
      exercisesCompleted: state.completedCount,
    }).catch(() => {})
  }, [state.phase])

  function handleEasierAlternative() {
    const alt = currentEx?.easier_alternative
    if (!alt) return
    dispatch({
      type: 'REPLACE_EXERCISE',
      exercise: { ...alt, easier_alternative: null },
    })
  }

  // ── INTRO ────────────────────────────────────────────────────────────────

  if (state.phase === 'intro') {
    return (
      <Screen>
        <div
          className="flex flex-col items-center justify-center flex-1 gap-4"
          style={{ animation: 'fadeIn 300ms ease' }}
        >
          <h1
            className="text-4xl font-bold text-center"
            style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}
          >
            {title}
          </h1>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            {state.exercises.length} ejercicios · {durationMinutes} min
          </p>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      </Screen>
    )
  }

  // ── FINISH ───────────────────────────────────────────────────────────────

  if (state.phase === 'finish') {
    const now = Date.now()
    const started = startedAtRef.current?.getTime() ?? now
    const elapsed = Math.max(1, Math.round((now - started) / 60000))
    const motivational = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]

    return (
      <Screen>
        <div className="flex flex-col flex-1 items-center justify-center gap-8 px-4">
          <div className="flex flex-col items-center gap-2">
            <h1
              className="text-3xl font-bold text-center"
              style={{ color: 'var(--color-text-primary)' }}
            >
              ¡Sesión completada!
            </h1>
            <p
              className="text-base italic text-center"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {motivational}
            </p>
          </div>

          <div className="flex gap-8">
            <StatBlock label="Tiempo" value={`${elapsed} min`} />
            <StatBlock label="Ejercicios" value={`${state.completedCount} de ${state.exercises.length}`} />
          </div>

          <button
            className="btn-primary"
            style={{ maxWidth: '320px', width: '100%' }}
            onClick={() => router.push('/dashboard')}
          >
            Volver al inicio
          </button>
        </div>
      </Screen>
    )
  }

  // ── REST ─────────────────────────────────────────────────────────────────

  if (state.phase === 'rest') {
    const nextEx = state.exercises[state.exerciseIndex + 1]
    return (
      <Screen>
        <div className="flex flex-col flex-1 items-center justify-center gap-8 px-4">
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Descansa
          </h2>

          <span
            className="text-7xl font-bold tabular-nums"
            style={{ color: 'var(--color-accent)' }}
          >
            {state.restTimeLeft}
          </span>

          {nextEx && (
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Siguiente:{' '}
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {nextEx.name}
              </span>
            </p>
          )}

          <button
            onClick={() => dispatch({ type: 'SKIP_REST' })}
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Saltar descanso →
          </button>
        </div>
      </Screen>
    )
  }

  // ── EXERCISE ─────────────────────────────────────────────────────────────

  if (!currentEx) return null

  const totalSets = currentEx.sets_default ?? 1
  const nextSetsDone = state.setsDone + 1
  const isLastSet = nextSetsDone >= totalSets
  const progressPct = ((state.exerciseIndex + 1) / state.exercises.length) * 100

  return (
    <Screen>
      {/* Exit modal */}
      {state.showExitModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                ¿Seguro que quieres salir?
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Perderás el progreso de esta sesión.
              </p>
            </div>
            <button className="btn-primary" onClick={() => dispatch({ type: 'HIDE_EXIT' })}>
              Continuar entrenando
            </button>
            <button className="btn-secondary" onClick={() => router.push('/dashboard')}>
              Salir
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Ejercicio {state.exerciseIndex + 1} de {state.exercises.length}
        </p>
        <button
          onClick={() => dispatch({ type: 'SHOW_EXIT' })}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: '1.25rem',
            lineHeight: 1,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Salir"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-4">
        <div className="h-0.5 rounded-full w-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <div
            className="h-0.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: 'var(--color-accent)' }}
          />
        </div>
      </div>

      {/* Exercise card */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="card flex flex-col gap-4">
          {/* Name */}
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {currentEx.name}
          </h1>

          {/* Muscle groups */}
          <div className="flex flex-wrap gap-1.5">
            {currentEx.muscle_groups.map((m) => (
              <span key={m} className="pill" style={{ fontSize: '0.75rem' }}>
                {m}
              </span>
            ))}
          </div>

          {/* Sets/reps or duration */}
          <div>
            {isTimed ? (
              <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                {state.timerDone ? '¡Listo!' : `${state.exerciseTimeLeft}s`}
              </p>
            ) : (
              <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {currentEx.sets_default} × {currentEx.reps_default}
              </p>
            )}
          </div>

          {/* Instructions */}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {currentEx.instructions}
          </p>

          {/* Coaching cue */}
          <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
            {currentEx.coaching_cue}
          </p>

          {/* Difficulty dots */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Dificultad
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i < currentEx.difficulty
                      ? 'var(--color-accent)'
                      : 'var(--color-surface-raised)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-4 pb-8 flex flex-col gap-3">
        {isTimed ? (
          <button
            className="btn-primary"
            disabled={!state.timerDone}
            onClick={() => dispatch({ type: 'TIMED_NEXT' })}
          >
            {state.timerDone
              ? (isLastSet ? 'Siguiente ejercicio →' : `Serie ${nextSetsDone} de ${totalSets}`)
              : `Serie ${state.setsDone + 1} de ${totalSets}`}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Serie {state.setsDone + 1} de {totalSets}
            </p>
            <button
              className="btn-primary"
              onClick={() => dispatch({ type: 'COMPLETE_SET' })}
            >
              {isLastSet ? 'Siguiente ejercicio →' : 'Serie completada'}
            </button>
          </div>
        )}

        {currentEx.easier_alternative && (
          <button
            onClick={handleEasierAlternative}
            className="text-sm text-center"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              minHeight: '44px',
            }}
          >
            Hacer versión más fácil
          </button>
        )}
      </div>
    </Screen>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)', maxWidth: '390px', margin: '0 auto' }}
    >
      {children}
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </div>
  )
}
