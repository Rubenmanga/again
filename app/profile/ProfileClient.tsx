'use client'

import { useState, useTransition } from 'react'
import { updateOnboardingField, signOut } from './actions'

type FitnessLevel = 'never' | 'rusty' | 'active'
type PrimaryGoal = 'rebuild_muscle' | 'lose_fat' | 'feel_better' | 'energy'

const FITNESS_OPTIONS: { value: FitnessLevel; label: string }[] = [
  { value: 'never', label: 'Nunca he entrenado de verdad' },
  { value: 'rusty', label: 'Antes entrenaba, llevo tiempo sin hacerlo' },
  { value: 'active', label: 'Sigo siendo algo activo' },
]

const GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: 'rebuild_muscle', label: 'Recuperar músculo' },
  { value: 'lose_fat', label: 'Perder algo de grasa' },
  { value: 'feel_better', label: 'Sentirme mejor en el día a día' },
  { value: 'energy', label: 'Tener más energía' },
]

const EQUIPMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'Solo mi cuerpo' },
  { value: 'dumbbells', label: 'Mancuernas' },
  { value: 'resistance_bands', label: 'Elástico' },
  { value: 'pull_up_bar', label: 'Barra de dominadas' },
]

const FITNESS_LABELS: Record<FitnessLevel, string> = {
  never: 'Nunca he entrenado de verdad',
  rusty: 'Antes entrenaba, llevo tiempo sin hacerlo',
  active: 'Sigo siendo algo activo',
}

const GOAL_LABELS: Record<PrimaryGoal, string> = {
  rebuild_muscle: 'Recuperar músculo',
  lose_fat: 'Perder algo de grasa',
  feel_better: 'Sentirme mejor en el día a día',
  energy: 'Tener más energía',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  none: 'Solo mi cuerpo',
  dumbbells: 'Mancuernas',
  resistance_bands: 'Elástico',
  pull_up_bar: 'Barra de dominadas',
}

interface Props {
  initialFitnessLevel: FitnessLevel
  initialPrimaryGoal: PrimaryGoal
  initialEquipment: string[]
}

export default function ProfileClient({ initialFitnessLevel, initialPrimaryGoal, initialEquipment }: Props) {
  const [editing, setEditing] = useState<'fitness' | 'goal' | 'equipment' | null>(null)
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(initialFitnessLevel)
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(initialPrimaryGoal)
  const [equipment, setEquipment] = useState<string[]>(initialEquipment)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSigningOut, startSignOut] = useTransition()

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: '1rem',
    padding: '1.25rem',
  }

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

  function saveFitness() {
    setError(null)
    startTransition(async () => {
      const result = await updateOnboardingField('fitness_level', fitnessLevel)
      if (result?.error) { setError(result.error); return }
      setEditing(null)
    })
  }

  function saveGoal() {
    setError(null)
    startTransition(async () => {
      const result = await updateOnboardingField('primary_goal', primaryGoal)
      if (result?.error) { setError(result.error); return }
      setEditing(null)
    })
  }

  function saveEquipment() {
    setError(null)
    if (equipment.length === 0) return
    startTransition(async () => {
      const result = await updateOnboardingField('equipment', equipment)
      if (result?.error) { setError(result.error); return }
      setEditing(null)
    })
  }

  function handleSignOut() {
    startSignOut(async () => {
      await signOut()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {error && (
        <p className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
          {error}
        </p>
      )}

      {/* Fitness level */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing === 'fitness' ? '1rem' : 0 }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Tu nivel
            </p>
            {editing !== 'fitness' && (
              <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {FITNESS_LABELS[fitnessLevel]}
              </p>
            )}
          </div>
          {editing !== 'fitness' ? (
            <button
              onClick={() => setEditing('fitness')}
              className="text-xs"
              style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Editar
            </button>
          ) : (
            <button
              onClick={() => setEditing(null)}
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
        {editing === 'fitness' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FITNESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFitnessLevel(opt.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${fitnessLevel === opt.value ? 'var(--color-accent)' : 'transparent'}`,
                  backgroundColor: fitnessLevel === opt.value ? 'var(--color-surface-raised)' : 'var(--color-surface-raised)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: fitnessLevel === opt.value ? 1 : 0.7,
                }}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={saveFitness}
              disabled={isPending}
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Primary goal */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing === 'goal' ? '1rem' : 0 }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Tu objetivo
            </p>
            {editing !== 'goal' && (
              <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {GOAL_LABELS[primaryGoal]}
              </p>
            )}
          </div>
          {editing !== 'goal' ? (
            <button
              onClick={() => setEditing('goal')}
              className="text-xs"
              style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Editar
            </button>
          ) : (
            <button
              onClick={() => setEditing(null)}
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
        {editing === 'goal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPrimaryGoal(opt.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${primaryGoal === opt.value ? 'var(--color-accent)' : 'transparent'}`,
                  backgroundColor: 'var(--color-surface-raised)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: primaryGoal === opt.value ? 1 : 0.7,
                }}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={saveGoal}
              disabled={isPending}
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Equipment */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing === 'equipment' ? '1rem' : 0 }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Tu equipo
            </p>
            {editing !== 'equipment' && (
              <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {equipment.map((e) => EQUIPMENT_LABELS[e] ?? e).join(', ')}
              </p>
            )}
          </div>
          {editing !== 'equipment' ? (
            <button
              onClick={() => setEditing('equipment')}
              className="text-xs"
              style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Editar
            </button>
          ) : (
            <button
              onClick={() => setEditing(null)}
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
        {editing === 'equipment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {EQUIPMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleEquipment(opt.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${equipment.includes(opt.value) ? 'var(--color-accent)' : 'transparent'}`,
                  backgroundColor: 'var(--color-surface-raised)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  opacity: equipment.includes(opt.value) ? 1 : 0.7,
                }}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={saveEquipment}
              disabled={isPending || equipment.length === 0}
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        style={{
          padding: '0.875rem',
          borderRadius: '1rem',
          backgroundColor: 'transparent',
          border: '1px solid var(--color-surface-raised)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginTop: '0.5rem',
        }}
      >
        {isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>

    </div>
  )
}
