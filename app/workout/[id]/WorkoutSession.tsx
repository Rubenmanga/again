'use client'

import { useReducer, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorkoutHistoryAction } from '@/app/actions/save-workout-history'
import { upsertWorkoutSession } from '@/app/actions/workout-session'
import ExerciseImage from './ExerciseImage'
import SwapDrawer from './SwapDrawer'
import type { WorkoutExercise } from './page'

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = 'preview' | 'intro' | 'exercise' | 'rest' | 'feedback' | 'finish'

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
  | { type: 'START_PREVIEW' }
  | { type: 'ADVANCE_TO_EXERCISE' }
  | { type: 'COMPLETE_SET' }
  | { type: 'TIMED_NEXT' }
  | { type: 'EXERCISE_TICK' }
  | { type: 'REST_TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'SHOW_EXIT' }
  | { type: 'HIDE_EXIT' }
  | { type: 'REPLACE_EXERCISE'; exercise: WorkoutExercise }
  | { type: 'SUBMIT_FEEDBACK' }

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

function finishOrRest(state: State, nextCompletedCount: number): State {
  const isLast = state.exerciseIndex === state.exercises.length - 1
  if (isLast) {
    return { ...state, phase: 'feedback', completedCount: nextCompletedCount }
  }
  return { ...state, phase: 'rest', restTimeLeft: 20, completedCount: nextCompletedCount }
}

function reducer(state: State, action: Action): State {
  const currentEx = state.exercises[state.exerciseIndex]
  const totalSets = currentEx?.sets_default ?? 1

  switch (action.type) {
    case 'START_PREVIEW': {
      return { ...state, phase: 'intro' }
    }

    case 'ADVANCE_TO_EXERCISE': {
      return {
        ...state,
        phase: 'exercise',
        ...makeExerciseState(state.exercises, state.exerciseIndex),
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

    case 'SUBMIT_FEEDBACK': {
      return { ...state, phase: 'finish' }
    }

    default: return state
  }
}

// ─── Haptic / Audio utilities ────────────────────────────────────────────────

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

function playBeep(frequency: number, duration: number, volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  } catch {}
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
  fitnessLevel,
  equipment,
  initialExerciseIndex = 0,
}: {
  workoutId: string
  title: string
  durationMinutes: number
  exercises: WorkoutExercise[]
  userId: string
  fitnessLevel: 'never' | 'rusty' | 'active'
  equipment: string[]
  initialExerciseIndex?: number
}) {
  const router = useRouter()
  const startedAtRef = useRef<Date | null>(null)
  const savedRef = useRef(false)
  const prevPhaseRef = useRef<Phase>('preview')
  const feedbackIntensityRef = useRef<number | null>(null)
  const feedbackMoodRef = useRef<number | null>(null)

  const [showSwapDrawer, setShowSwapDrawer] = useState(false)
  const [feedbackIntensity, setFeedbackIntensity] = useState<number | null>(null)
  const [feedbackMood, setFeedbackMood] = useState<number | null>(null)

  const [state, dispatch] = useReducer(reducer, {
    phase: 'preview',
    exerciseIndex: initialExerciseIndex,
    setsDone: 0,
    restTimeLeft: 20,
    exerciseTimeLeft: exercises[initialExerciseIndex]?.duration_seconds ?? 0,
    timerDone: false,
    completedCount: 0,
    showExitModal: false,
    exercises,
  })

  const currentEx = state.exercises[state.exerciseIndex]
  const isTimed = (currentEx?.duration_seconds ?? null) !== null

  const maxDifficulty = ({ never: 2, rusty: 3, active: 4 } as const)[fitnessLevel]
  const equipmentFilter = equipment.includes('resistance_bands') ? ['none', 'resistance_bands'] : ['none']
  const excludeIds = state.exercises.filter(ex => ex.id !== currentEx?.id).map(ex => ex.id)

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

  // Save progress when exercise index changes
  useEffect(() => {
    if (state.phase !== 'exercise' && state.phase !== 'rest') return
    upsertWorkoutSession({
      workoutId,
      currentExerciseIndex: state.exerciseIndex,
      completed: false,
    }).catch(() => {})
  }, [state.exerciseIndex])

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
      intensityActual: feedbackIntensityRef.current ?? undefined,
      moodAfter: feedbackMoodRef.current ?? undefined,
    }).catch(() => {})
    upsertWorkoutSession({
      workoutId,
      currentExerciseIndex: state.exerciseIndex,
      completed: true,
    }).catch(() => {})
  }, [state.phase])

  // Haptic: countdown last 3 seconds
  useEffect(() => {
    if (state.phase !== 'exercise') return
    if (!isTimed) return
    if (state.exerciseTimeLeft <= 3 && state.exerciseTimeLeft > 0) {
      playBeep(440, 100)
      vibrate(30)
    }
    if (state.exerciseTimeLeft === 0) {
      playBeep(660, 200)
      vibrate(80)
    }
  }, [state.exerciseTimeLeft])

  // Haptic: finish celebration
  useEffect(() => {
    if (state.phase !== 'finish') return
    vibrate([100, 50, 100, 50, 200])
    playBeep(880, 150)
    setTimeout(() => playBeep(1100, 250), 200)
  }, [state.phase])

  // Haptic: rest → exercise transition
  useEffect(() => {
    if (state.phase === 'exercise' && prevPhaseRef.current === 'rest') {
      vibrate(40)
      playBeep(520, 80)
    }
    prevPhaseRef.current = state.phase
  }, [state.phase, state.exerciseIndex])

  function handleCompleteSet() {
    vibrate(50)
    playBeep(600, 80)
    dispatch({ type: 'COMPLETE_SET' })
  }

  function handleTimedNext() {
    vibrate(50)
    playBeep(600, 80)
    dispatch({ type: 'TIMED_NEXT' })
  }

  function handleEasierAlternative() {
    const alt = currentEx?.easier_alternative
    if (!alt) return
    dispatch({
      type: 'REPLACE_EXERCISE',
      exercise: { ...alt, easier_alternative: null },
    })
  }

  // ── PREVIEW ──────────────────────────────────────────────────────────────

  if (state.phase === 'preview') {
    return (
      <Screen>
        <div className="flex items-center justify-between px-4 pt-6 pb-2">
          <button
            onClick={() => router.push('/dashboard')}
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
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {durationMinutes} min
          </span>
        </div>

        <div className="px-4 pb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {state.exercises.length} ejercicios
          </p>
          {initialExerciseIndex > 0 && (
            <p style={{ color: 'var(--color-accent)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Continúas desde el ejercicio {initialExerciseIndex + 1}
            </p>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {state.exercises.map((ex, i) => (
            <div
              key={ex.id}
              className="card"
              style={{
                padding: '0.875rem 1rem',
                display: 'flex',
                flexDirection: 'row',
                gap: '0.75rem',
                alignItems: 'center',
                opacity: i < initialExerciseIndex ? 0.4 : 1,
              }}
            >
              <span
                className="text-sm"
                style={{ fontWeight: 700, color: 'var(--color-accent)', minWidth: '24px' }}
              >
                {i + 1}
              </span>

              {ex.gif_url && (
                <img
                  src={ex.gif_url}
                  alt={ex.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    flexShrink: 0,
                  }}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="text-sm"
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ex.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                  {ex.duration_seconds
                    ? `${ex.sets_default ?? 1} × ${ex.duration_seconds}s`
                    : `${ex.sets_default ?? 1} × ${ex.reps_default} reps`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: j < ex.difficulty ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-8">
          <button className="btn-primary" onClick={() => dispatch({ type: 'START_PREVIEW' })}>
            Empezar
          </button>
        </div>
      </Screen>
    )
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

  // ── FEEDBACK ─────────────────────────────────────────────────────────────

  if (state.phase === 'feedback') {
    const canSubmit = feedbackIntensity !== null && feedbackMood !== null

    function handleSubmitFeedback() {
      feedbackIntensityRef.current = feedbackIntensity
      feedbackMoodRef.current = feedbackMood
      dispatch({ type: 'SUBMIT_FEEDBACK' })
    }

    return (
      <Screen>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem', padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '1rem' }}>
              ¿Qué tan duro fue?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFeedbackIntensity(n)}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '0.75rem',
                    border: `2px solid ${feedbackIntensity === n ? 'var(--color-accent)' : 'transparent'}`,
                    backgroundColor: 'var(--color-surface-raised)',
                    color: feedbackIntensity === n ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    fontWeight: feedbackIntensity === n ? 700 : 400,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    opacity: feedbackIntensity !== null && feedbackIntensity !== n ? 0.5 : 1,
                    transition: 'all 150ms ease',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '1rem' }}>
              ¿Cómo te sientes ahora?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { value: 1, label: 'Peor' },
                { value: 3, label: 'Igual' },
                { value: 5, label: 'Mejor' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFeedbackMood(opt.value)}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${feedbackMood === opt.value ? 'var(--color-accent)' : 'transparent'}`,
                    backgroundColor: 'var(--color-surface-raised)',
                    color: feedbackMood === opt.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: feedbackMood === opt.value ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    opacity: feedbackMood !== null && feedbackMood !== opt.value ? 0.5 : 1,
                    transition: 'all 150ms ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmitFeedback}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.4 }}
          >
            Guardar
          </button>

          <button
            onClick={() => dispatch({ type: 'SUBMIT_FEEDBACK' })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontSize: '0.75rem',
              minHeight: '44px',
            }}
          >
            Saltar
          </button>
        </div>
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

          {feedbackIntensityRef.current !== null && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', fontStyle: 'italic' }}>
              Guardado. Esta sesión cuenta.
            </p>
          )}

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
      {/* Swap drawer */}
      {showSwapDrawer && (
        <SwapDrawer
          currentExercise={currentEx}
          excludeIds={excludeIds}
          maxDifficulty={maxDifficulty}
          equipmentFilter={equipmentFilter}
          onSwap={(exercise) => {
            dispatch({ type: 'REPLACE_EXERCISE', exercise })
            setShowSwapDrawer(false)
          }}
          onClose={() => setShowSwapDrawer(false)}
        />
      )}

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
          <ExerciseImage
            img0={currentEx.gif_url}
            img1={currentEx.thumbnail_url}
            name={currentEx.name}
          />

          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {currentEx.name}
          </h1>

          <div className="flex flex-wrap gap-1.5">
            {currentEx.muscle_groups.map((m) => (
              <span key={m} className="pill" style={{ fontSize: '0.75rem' }}>
                {m}
              </span>
            ))}
          </div>

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

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {currentEx.instructions}
          </p>

          <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
            {currentEx.coaching_cue}
          </p>

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
            onClick={handleTimedNext}
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
              onClick={handleCompleteSet}
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

        <button
          onClick={() => setShowSwapDrawer(true)}
          className="text-sm text-center"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            minHeight: '44px',
          }}
        >
          Cambiar ejercicio
        </button>

        <button
          onClick={() => {
            import('@/app/actions/exercise-preferences').then(({ markExerciseDisliked }) => {
              markExerciseDisliked(currentEx.id).catch(() => {})
            })
            setShowSwapDrawer(true)
          }}
          className="text-sm text-center"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            minHeight: '44px',
            fontSize: '0.75rem',
          }}
        >
          No me gusta este ejercicio
        </button>
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
