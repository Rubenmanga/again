'use client'

import { useState, useTransition } from 'react'
import { completeOnboarding, type OnboardingData } from './actions'

// ─── Data ──────────────────────────────────────────────────────────────────

const FITNESS_LEVELS: { value: OnboardingData['fitness_level']; label: string; sub: string }[] = [
  { value: 'never', label: 'Nunca he entrenado de verdad', sub: 'Empezando desde cero — sin problema' },
  { value: 'rusty', label: 'Antes entrenaba, pero llevo tiempo sin hacerlo', sub: 'Es hora de retomar los hábitos' },
  { value: 'active', label: 'Sigo siendo algo activo', sub: 'Sigue adelante con el ritmo' },
]

const PRIMARY_GOALS: { value: OnboardingData['primary_goal']; label: string; sub: string }[] = [
  { value: 'rebuild_muscle', label: 'Recuperar músculo', sub: 'Recuperar fuerza y volumen' },
  { value: 'lose_fat', label: 'Perder algo de grasa', sub: 'Ponerse en forma y sentirse más ligero' },
  { value: 'feel_better', label: 'Sentirme mejor en el día a día', sub: 'Moverse bien, dormir bien, vivir bien' },
  { value: 'energy', label: 'Tener más energía', sub: 'Dejar de sentirse agotado antes del mediodía' },
]

const TIMES: { value: OnboardingData['available_time']; label: string; sub: string }[] = [
  { value: 15, label: '15 min', sub: 'Rápido y concentrado' },
  { value: 30, label: '30 min', sub: 'El tiempo justo' },
  { value: 45, label: '45 min', sub: 'Sesión completa' },
  { value: 60, label: '60 min', sub: 'Sin prisa' },
]

const EQUIPMENT: { value: string; label: string; sub: string }[] = [
  { value: 'none', label: 'Solo mi cuerpo', sub: 'Sin equipamiento' },
  { value: 'dumbbells', label: 'Mancuernas', sub: 'Fijas o ajustables' },
  { value: 'resistance_bands', label: 'Elástico', sub: 'De ligero a intenso' },
  { value: 'pull_up_bar', label: 'Barra de dominadas', sub: 'De marco de puerta o pared' },
]

const DAYS = [
  { label: 'Lu', value: 1 },
  { label: 'Ma', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Ju', value: 4 },
  { label: 'Vi', value: 5 },
  { label: 'Sa', value: 6 },
  { label: 'Do', value: 0 },
]

const TOTAL_STEPS = 5

// ─── Styles ────────────────────────────────────────────────────────────────

const cardBase: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '2px solid transparent',
  borderRadius: '1rem',
  padding: '1.25rem',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, background-color 150ms ease',
  textAlign: 'left',
  width: '100%',
}

const cardSelected: React.CSSProperties = {
  ...cardBase,
  borderColor: 'var(--color-accent)',
  backgroundColor: 'var(--color-surface-raised)',
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [fitnessLevel, setFitnessLevel] = useState<OnboardingData['fitness_level'] | null>(null)
  const [primaryGoal, setPrimaryGoal] = useState<OnboardingData['primary_goal'] | null>(null)
  const [availableTime, setAvailableTime] = useState<OnboardingData['available_time'] | null>(null)
  const [equipment, setEquipment] = useState<string[]>([])
  const [scheduleDays, setScheduleDays] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canAdvance =
    (step === 1 && fitnessLevel !== null) ||
    (step === 2 && primaryGoal !== null) ||
    (step === 3 && availableTime !== null) ||
    (step === 4 && equipment.length > 0) ||
    (step === 5 && scheduleDays.length > 0)

  function toggleEquipment(value: string) {
    if (value === 'none') {
      setEquipment(['none'])
    } else {
      setEquipment((prev) => {
        const without = prev.filter((e) => e !== 'none')
        return without.includes(value) ? without.filter((e) => e !== value) : [...without, value]
      })
    }
  }

  function toggleDay(value: number) {
    setScheduleDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    )
  }

  function handleNext() {
    if (canAdvance) setStep((s) => s + 1)
  }

  function handleBack() {
    setStep((s) => s - 1)
    setError(null)
  }

  function handleSubmit() {
    if (!fitnessLevel || !primaryGoal || !availableTime) return
    setError(null)
    startTransition(async () => {
      const result = await completeOnboarding({
        fitness_level: fitnessLevel,
        primary_goal: primaryGoal,
        available_time: availableTime,
        equipment,
        schedule_days: scheduleDays,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 pt-12 pb-16"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo + progress */}
        <div className="flex flex-col gap-4">
          <span
            className="text-3xl font-bold tracking-tight select-none text-center"
            style={{ color: 'var(--color-accent)', letterSpacing: '-0.02em' }}
          >
            AGAIN
          </span>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Paso {step} de {TOTAL_STEPS}</span>
            </div>
            <div className="w-full h-1 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(step / TOTAL_STEPS) * 100}%`,
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="flex flex-col gap-6">
          {step === 1 && (
            <StepShell title="¿Cuánto tiempo llevas sin entrenar?" sub="Sé honesto — esto define tus entrenos">
              {FITNESS_LEVELS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={fitnessLevel === opt.value}
                  onClick={() => setFitnessLevel(opt.value)}
                />
              ))}
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="¿Qué es lo que más quieres conseguir?" sub="Todo lo diseñaremos en torno a esto">
              {PRIMARY_GOALS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={primaryGoal === opt.value}
                  onClick={() => setPrimaryGoal(opt.value)}
                />
              ))}
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="¿Cuánto tiempo tienes por sesión?" sub="Elige lo que puedes cumplir de verdad">
              {TIMES.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={availableTime === opt.value}
                  onClick={() => setAvailableTime(opt.value)}
                />
              ))}
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="¿Con qué cuentas en casa?" sub="Selecciona todo lo que tengas">
              {EQUIPMENT.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  selected={equipment.includes(opt.value)}
                  onClick={() => toggleEquipment(opt.value)}
                  multi
                />
              ))}
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="¿Qué días te vienen bien?" sub="Elige al menos uno">
              <div className="flex flex-wrap gap-2 pt-1">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className="pill"
                    style={
                      scheduleDays.includes(day.value)
                        ? {
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-text-primary)',
                            fontWeight: 600,
                            border: 'none',
                          }
                        : {
                            backgroundColor: 'var(--color-surface-raised)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid transparent',
                          }
                    }
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </StepShell>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className={`flex gap-3 ${step === 1 ? '' : 'flex-row'}`}>
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={isPending}
              className="btn-secondary"
              style={{ flex: '0 0 auto', width: '5rem' }}
            >
              ←
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canAdvance}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canAdvance || isPending}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {isPending ? 'Guardando…' : '¡Vamos! →'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StepShell({
  title,
  sub,
  children,
}: {
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {sub}
        </p>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function OptionCard({
  label,
  sub,
  selected,
  onClick,
  multi = false,
}: {
  label: string
  sub: string
  selected: boolean
  onClick: () => void
  multi?: boolean
}) {
  return (
    <button onClick={onClick} style={selected ? cardSelected : cardBase}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {sub}
          </p>
        </div>
        <div
          className="shrink-0 ml-3 w-5 h-5 flex items-center justify-center"
          style={{
            borderRadius: multi ? '0.25rem' : '9999px',
            border: selected
              ? '2px solid var(--color-accent)'
              : '2px solid var(--color-surface-raised)',
            backgroundColor: selected ? 'var(--color-accent)' : 'transparent',
            transition: 'all 150ms ease',
          }}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}
