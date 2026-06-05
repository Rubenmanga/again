'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateWorkoutAction } from '@/app/actions/generate-workout'

const DURATIONS: { value: 15 | 30 | 45 | 60; label: string; sub: string }[] = [
  { value: 15, label: '15 min', sub: 'Rápido y concentrado' },
  { value: 30, label: '30 min', sub: 'El tiempo justo' },
  { value: 45, label: '45 min', sub: 'Sesión completa' },
  { value: 60, label: '60 min', sub: 'Sin prisa' },
]

interface Props {
  todayWorkout: { id: string; title: string; duration_minutes: number | null } | null
}

export default function StartWorkoutButton({ todayWorkout }: Props) {
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSelect(duration: 15 | 30 | 45 | 60) {
    setError(null)
    startTransition(async () => {
      const result = await generateWorkoutAction(duration)
      if (result?.error) {
        setError(result.error)
        setPicking(false)
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

  if (!picking) {
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
            onClick={() => setPicking(true)}
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
        <button onClick={() => setPicking(true)} className="btn-primary w-full">
          Empezar
        </button>
        {error && (
          <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>
        )}
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
            onClick={() => handleSelect(d.value)}
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
        onClick={() => setPicking(false)}
        className="text-xs"
        style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
      >
        Cancelar
      </button>
    </div>
  )
}
