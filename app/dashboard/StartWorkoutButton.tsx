'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateWorkoutAction } from '@/app/actions/generate-workout'
import type { EnergyMode } from '@/lib/workout-engine'

const DURATIONS: { value: 15 | 30 | 45 | 60; label: string; sub: string }[] = [
  { value: 15, label: '15 min', sub: 'Rápido y concentrado' },
  { value: 30, label: '30 min', sub: 'El tiempo justo' },
  { value: 45, label: '45 min', sub: 'Sesión completa' },
  { value: 60, label: '60 min', sub: 'Sin prisa' },
]

const ENERGY_OPTIONS: { value: EnergyMode; label: string; sub: string }[] = [
  { value: 'normal', label: 'Normal', sub: 'A tope' },
  { value: 'low', label: 'Cansado', sub: 'Algo suave' },
  { value: 'minimal', label: 'Sin ganas', sub: 'Corto y al grano' },
  { value: 'bare', label: 'Solo quiero cumplir', sub: 'Mínimo posible' },
]

const ENERGY_MESSAGES: Partial<Record<EnergyMode, string>> = {
  bare: 'Perfecto. Hoy solo hay que cumplir.',
  minimal: 'Algo corto también cuenta.',
  low: 'Sin problema. Vamos suave.',
}

type Step = 'idle' | 'energy' | 'duration'

interface Props {
  todayWorkout: { id: string; title: string; duration_minutes: number | null } | null
}

export default function StartWorkoutButton({ todayWorkout }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyMode>('normal')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEnergySelect(energy: EnergyMode) {
    setSelectedEnergy(energy)
    if (energy === 'bare' || energy === 'minimal') {
      setError(null)
      startTransition(async () => {
        const result = await generateWorkoutAction(15, energy)
        if (result?.error) {
          setError(result.error)
          setStep('idle')
        }
      })
    } else {
      setStep('duration')
    }
  }

  function handleDurationSelect(duration: 15 | 30 | 45 | 60) {
    setError(null)
    startTransition(async () => {
      const result = await generateWorkoutAction(duration, selectedEnergy)
      if (result?.error) {
        setError(result.error)
        setStep('idle')
      }
    })
  }

  if (isPending) {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm text-center"
        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
      >
        Generando entrenamiento…
      </div>
    )
  }

  if (step === 'idle') {
    if (todayWorkout !== null) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <div>
              <p
                className="text-xs uppercase"
                style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.08em', fontWeight: 600 }}
              >
                Tu rutina de hoy
              </p>
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginTop: '0.125rem' }}
              >
                {todayWorkout.title}
              </p>
              {todayWorkout.duration_minutes !== null && (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                  {todayWorkout.duration_minutes} min
                </p>
              )}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => router.push(`/workout/${todayWorkout.id}`)}
          >
            Continuar
          </button>
          <button
            onClick={() => setStep('energy')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              minHeight: '44px',
            }}
          >
            + Generar nueva rutina
          </button>
          {error && (
            <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>
          )}
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button onClick={() => setStep('energy')} className="btn-primary w-full">
          Empezar
        </button>
        {error && (
          <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>
        )}
      </div>
    )
  }

  if (step === 'energy') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ¿Cómo estás hoy?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ENERGY_OPTIONS.map((opt) => (
            <div key={opt.value}>
              <button
                onClick={() => handleEnergySelect(opt.value)}
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid transparent',
                  borderRadius: '0.75rem',
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {opt.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {opt.sub}
                </span>
              </button>
              {selectedEnergy === opt.value && ENERGY_MESSAGES[opt.value] && (
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)', padding: '0.25rem 0.5rem 0', fontStyle: 'italic' }}
                >
                  {ENERGY_MESSAGES[opt.value]}
                </p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep('idle')}
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        ¿Cuánto tiempo tienes?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {DURATIONS.map((d) => (
          <button
            key={d.value}
            onClick={() => handleDurationSelect(d.value)}
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid transparent',
              borderRadius: '0.75rem',
              padding: '0.875rem 1rem',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {d.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {d.sub}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep('idle')}
        className="text-xs"
        style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
      >
        Cancelar
      </button>
    </div>
  )
}
