import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/app/dashboard/BottomNav'

function getWeekStart(offsetWeeks = 0): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff - offsetWeeks * 7)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function getMonthStart(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function getMonthName(): string {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return months[new Date().getUTCMonth()]
}

function calculateStreak(history: Array<{ completed_at: string | null }>): number {
  const daysWithWorkout = new Set(
    history.filter((h) => h.completed_at).map((h) => h.completed_at!.slice(0, 10))
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

function getContextualMessage(sessionsThisWeek: number, streak: number): string {
  if (streak >= 7) return `Llevas ${streak} días seguidos. Eso ya es un hábito.`
  if (sessionsThisWeek === 0) return 'Esta semana aún no te has movido. No pasa nada, todavía estás a tiempo.'
  if (sessionsThisWeek <= 2) return `Llevas ${sessionsThisWeek} ${sessionsThisWeek === 1 ? 'sesión' : 'sesiones'} esta semana. El hábito se construye así.`
  return 'Buena semana. Estás en racha.'
}


export default async function ProgressPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStart()
  const lastWeekStart = getWeekStart(1)
  const monthStart = getMonthStart()

  const [{ data: allHistory }, { data: recentHistory }] = await Promise.all([
    supabase
      .from('workout_history')
      .select('completed_at, duration_actual_minutes')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
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
    (h) => h.completed_at && h.completed_at.slice(0, 10) >= weekStart
  )
  const lastWeekHistory = history.filter(
    (h) => h.completed_at && h.completed_at.slice(0, 10) >= lastWeekStart && h.completed_at.slice(0, 10) < weekStart
  )
  const thisMonthHistory = history.filter(
    (h) => h.completed_at && h.completed_at.slice(0, 10) >= monthStart
  )

  const sessionsThisWeek = thisWeekHistory.length
  const minutesThisWeek = thisWeekHistory.reduce((sum, h) => sum + (h.duration_actual_minutes ?? 0), 0)
  const minutesLastWeek = lastWeekHistory.reduce((sum, h) => sum + (h.duration_actual_minutes ?? 0), 0)
  const streak = calculateStreak(history)

  const daysActiveThisMonth = new Set(
    thisMonthHistory.map((h) => h.completed_at!.slice(0, 10))
  ).size

  const totalSessions = history.length
  const totalMinutes = history.reduce((sum, h) => sum + (h.duration_actual_minutes ?? 0), 0)

  const minutesDiff = minutesThisWeek - minutesLastWeek
  const minutesComparisonText = minutesLastWeek === 0
    ? null
    : minutesDiff > 0
    ? `↑ ${minutesDiff} min más que la semana pasada`
    : minutesDiff < 0
    ? `${Math.abs(minutesDiff)} min menos que la semana pasada, pero sigues aquí.`
    : 'Mismo ritmo que la semana pasada.'

  // Upsert progress_stats
  const { data: existingStats } = await supabase
    .from('progress_stats')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  const statsPayload = {
    sessions_count: sessionsThisWeek,
    minutes_trained: minutesThisWeek,
    streak_days: streak,
    consistency_pct: 0,
  }

  if (existingStats?.id) {
    await supabase.from('progress_stats').update(statsPayload).eq('id', existingStats.id)
  } else {
    await supabase.from('progress_stats').insert({ user_id: user.id, week_start: weekStart, ...statsPayload })
  }

  const contextualMessage = getContextualMessage(sessionsThisWeek, streak)
  const last7 = recentHistory ?? []

  const statCards = [
    { label: 'Sesiones', value: String(sessionsThisWeek) },
    { label: 'Minutos', value: String(minutesThisWeek) },
    { label: 'Racha', value: `${streak} días` },
    { label: `En ${getMonthName()}`, value: `${daysActiveThisMonth} días` },
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

        {/* Contextual message */}
        <section>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            {contextualMessage}
          </p>
        </section>


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
                <span className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {value}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          {minutesComparisonText && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {minutesComparisonText}
            </p>
          )}
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
                    <span className="text-sm shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                      {entry.duration_actual_minutes != null ? `${entry.duration_actual_minutes} min` : '—'}
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
              <span className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {totalSessions}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                sesiones
              </span>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--color-surface-raised)', alignSelf: 'stretch' }} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
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
