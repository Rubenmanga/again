'use client'

import { useState, useTransition } from 'react'
import { generateWorkoutAction } from '@/app/actions/generate-workout'

export default function StartWorkoutButton() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    setError(null)
    startTransition(async () => {
      const result = await generateWorkoutAction()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleStart} disabled={isPending} className="btn-primary">
        {isPending ? 'Generando…' : 'Empezar'}
      </button>
      {error && (
        <p className="text-sm text-center" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
    </div>
  )
}
