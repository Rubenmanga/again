import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/app/dashboard/BottomNav'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function calculateStreak(history: Array<{ completed_at: string | null }>): number {
  const daysWithWorkout = new Set(
    history
      .filter((h) => h.completed_at)
      .map((h) => h.completed_at!.slice(0, 10))
  )

  const checkDate = new Date()
  checkDate.setUTCHours(0, 0, 0, 0)

  if (!daysWithWorkout.has(checkDate.toISOString().slice(0, 10))) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1)
  }

  let streak = 0
  while (daysWithWorkout.has(checkDate.toISOString().slice(0, 10))) {
    streak++
    checkDate.setUTCDate(checkDate.getUTCDate() - 1)
  }

  return streak
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[date.getUTCDay()]} ${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}

export default async function ProgressPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStart()

  const [{ data: allHistory }, { data: onboarding }, { data: recentHistory }] =
    await Promise.all([
      supabase
        .from('workout_history')
        .select('completed_at, duration_actual_minutes')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false }),
      supabase
        .from('onboarding')
        .select('schedule_days')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('workout_history')
        .select('completed_at, duration_actual_minutes, workouts(title)')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(7),
    ])

  const history = allHistory ?? []

  const thisWeekHistory = history.filter(
    (h) => h.completed_at && h.completed_at >= weekStart + 'T00:00:00.000Z'
  )

  const sessionsThisWeek = thisWeekHistory.length
  const minutesThisWeek = thisWeekHistory.reduce(
    (sum, h) => sum + (h.duration_actual_minutes ?? 0),
    0
  )
  const streak = calculateStreak(history)
  const daysTrainedThisWeek = new Set(
    thisWeekHistory.map((h) => h.completed_at!.slice(0, 10))
  ).size
  const scheduleDaysCount = onboarding?.schedule_days?.length || 3
  const consistencyPct = Math.min(
    100,
    scheduleDaysCount > 0
      ? Math.round((daysTrainedThisWeek / scheduleDaysCount) * 100)
      : 0
  )

  const totalSessions = history.length
  const totalMinutes = history.reduce(
    (sum, h) => sum + (h.duration_actual_minutes ?? 0),
    0
  )

  // Save current week stats
  const { data: existingStats } = await supabase
    .from('progress_stats')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (existingStats?.id) {
    await supabase
      .from('progress_stats')
      .update({
        sessions_count: sessionsThisWeek,
        minutes_trained: minutesThisWeek,
        streak_days: streak,
        consistency_pct: consistencyPct,
      })
      .eq('id', existingStats.id)
  } else {
    await supabase.from('progress_stats').insert({
      user_id: user.id,
      week_start: weekStart,
      sessions_count: sessionsThisWeek,
      minutes_trained: minutesThisWeek,
      streak_days: streak,
      consistency_pct: consistencyPct,
    })
  }

  const last7 = recentHistory ?? []

  const statCards = [
    { label: 'Sesiones', value: String(sessionsThisWeek) },
    { label: 'Minutos', value: String(minutesThisWeek) },
    { label: 'Racha', value: `${streak} días` },
    { label: 'Constancia', value: `${consistencyPct}%` },
  ]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)', maxWidth: '390px', margin: '0 auto' }}
    >
      <div className="flex-1 flex flex-col px-4 pt-6 pb-28 gap-6">

        <header>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Progreso
          </h1>
        </header>

        {/* Esta semana */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Esta semana
          </p>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(({ label, value }) => (
              <div key={label} className="card flex flex-col gap-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {value}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Últimas sesiones */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Últimas sesiones
          </p>
          {last7.length === 0 ? (
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Aún no has completado ninguna sesión. Tu primera cuenta más de lo que crees.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {last7.map((entry, i) => {
                const workoutArr = entry.workouts as { title: string }[] | null
                const workout = Array.isArray(workoutArr) ? workoutArr[0] ?? null : workoutArr
                return (
                  <div
                    key={i}
                    className="card flex items-center justify-between gap-2"
                    style={{ padding: '1rem 1.25rem' }}
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {workout?.title ?? 'Entrenamiento'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(entry.completed_at!)}
                      </span>
                    </div>
                    <span
                      className="text-sm shrink-0"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {entry.duration_actual_minutes != null
                        ? `${entry.duration_actual_minutes} min`
                        : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Desde que empezaste */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Desde que empezaste
          </p>
          <div className="card flex justify-around gap-4">
            <div className="flex flex-col items-center gap-1">
              <span
                className="text-3xl font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                {totalSessions}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                sesiones
              </span>
            </div>
            <div
              style={{
                width: '1px',
                backgroundColor: 'var(--color-surface-raised)',
                alignSelf: 'stretch',
              }}
            />
            <div className="flex flex-col items-center gap-1">
              <span
                className="text-3xl font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                {totalMinutes}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                minutos
              </span>
            </div>
          </div>
        </section>

      </div>

      <BottomNav />
    </div>
  )
}
