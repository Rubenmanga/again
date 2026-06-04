import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from './BottomNav'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

const MESSAGES = [
  'Better 5 minutes than zero.',
  "You're rebuilding, not restarting.",
  'Today still counts.',
  'Momentum matters more than perfection.',
  'Small moves compound.',
]

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getWeekStartISO(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: onboarding }, { data: weekHistory }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('onboarding')
      .select('available_time, schedule_days')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('workout_history')
      .select('completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', getWeekStartISO()),
  ])

  if (!onboarding) redirect('/onboarding')

  const completedDays = new Set<number>(
    (weekHistory ?? [])
      .filter((r) => r.completed_at)
      .map((r) => new Date(r.completed_at as string).getUTCDay())
  )

  const now = new Date()
  const today = now.getUTCDay()
  const hour = now.getUTCHours()
  const greeting = getGreeting(hour)
  const message = MESSAGES[now.getUTCDay() % MESSAGES.length]
  const isRestDay = !onboarding.schedule_days.includes(today)

  const nameSource: string = profile?.display_name ?? profile?.email ?? user.email ?? ''
  const initials = nameSource
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('') || '?'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)', maxWidth: '390px', margin: '0 auto' }}
    >
      <div className="flex-1 flex flex-col px-4 pt-6 pb-28 gap-6">

        {/* Header */}
        <header className="flex items-center justify-between">
          <span
            className="text-xs font-bold select-none"
            style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.18em' }}
          >
            AGAIN
          </span>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
          >
            {initials}
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-col gap-1.5 pt-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {greeting}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {message}
          </p>
        </section>

        {/* Today's workout card */}
        <section>
          {isRestDay ? (
            <div className="card flex flex-col gap-2">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Today
              </p>
              <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Rest day
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Today's a rest day. That's part of the plan.
              </p>
            </div>
          ) : (
            <div className="card flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Today's workout
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {onboarding.available_time} min
                  </span>
                  <span style={{ color: 'var(--color-surface-raised)' }}>·</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    5 exercises
                  </span>
                </div>
              </div>
              <button className="btn-primary">
                Start workout
              </button>
            </div>
          )}
        </section>

        {/* Weekly streak */}
        <section className="card flex flex-col gap-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            This week
          </p>
          <div className="flex justify-between">
            {DAYS.map((day) => {
              const isToday = day.value === today
              const isDone = completedDays.has(day.value)
              return (
                <div key={day.value} className="flex flex-col items-center gap-1.5">
                  <span
                    className="text-xs"
                    style={{
                      color: isToday ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {day.label}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: isDone ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                      border: isToday ? '2px solid var(--color-accent)' : '2px solid transparent',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </section>

      </div>

      <BottomNav />
    </div>
  )
}
