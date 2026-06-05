'use client'

import { useEffect, useState } from 'react'
import { getExerciseAlternatives } from '@/app/actions/get-exercise-alternatives'
import type { Exercise } from '@/lib/workout-engine'
import type { WorkoutExercise } from './page'

interface SwapDrawerProps {
  currentExercise: WorkoutExercise
  excludeIds: string[]
  maxDifficulty: number
  equipmentFilter: string[]
  onSwap: (exercise: WorkoutExercise) => void
  onClose: () => void
}

export default function SwapDrawer({
  currentExercise,
  excludeIds,
  maxDifficulty,
  equipmentFilter,
  onSwap,
  onClose,
}: SwapDrawerProps) {
  const [alternatives, setAlternatives] = useState<Exercise[] | null>(null)

  useEffect(() => {
    getExerciseAlternatives(currentExercise.id, excludeIds, maxDifficulty, equipmentFilter)
      .then(setAlternatives)
      .catch(() => setAlternatives([]))
  }, [])

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '390px',
          borderRadius: '1.25rem 1.25rem 0 0',
          backgroundColor: 'var(--color-surface)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 51,
          animation: 'slideUp 250ms ease',
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div
            style={{
              width: '32px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--color-surface-raised)',
            }}
          />
        </div>

        {/* Title */}
        <p
          className="text-base"
          style={{ fontWeight: 600, color: 'var(--color-text-primary)', padding: '0 1rem 0.25rem' }}
        >
          Cambiar ejercicio
        </p>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)', padding: '0 1rem 0.75rem' }}
        >
          Elige uno para reemplazar {currentExercise.name}
        </p>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem 1.5rem' }}>
          {alternatives === null ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: '72px',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-surface-raised)',
                    opacity: 0.6,
                  }}
                />
              ))}
            </>
          ) : alternatives.length === 0 ? (
            <p
              className="text-sm text-center"
              style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}
            >
              No hay más ejercicios disponibles para este grupo
            </p>
          ) : (
            alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSwap({ ...alt, easier_alternative: null })}
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid transparent',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '0.75rem',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {alt.gif_url && (
                  <img
                    src={alt.gif_url}
                    alt={alt.name}
                    style={{
                      width: '56px',
                      height: '56px',
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
                    style={{ fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {alt.name}
                  </p>
                  {alt.muscle_groups[0] && (
                    <span className="pill" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}>
                      {alt.muscle_groups[0]}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: i < alt.difficulty ? 'var(--color-accent)' : 'var(--color-surface)',
                      }}
                    />
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
