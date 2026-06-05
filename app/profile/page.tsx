import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/app/dashboard/BottomNav'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('onboarding')
      .select('fitness_level, primary_goal, equipment')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!onboarding) redirect('/onboarding')

  const nameSource = profile?.display_name ?? profile?.email ?? user.email ?? ''

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)', maxWidth: '390px', margin: '0 auto' }}
    >
      <div className="flex-1 flex flex-col px-4 pt-6 pb-28 gap-6">

        {/* Header */}
        <header>
          <span
            className="text-xs font-bold select-none"
            style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.18em' }}
          >
            AGAIN
          </span>
        </header>

        <section className="flex flex-col gap-1.5 pt-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Tu perfil
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {nameSource}
          </p>
        </section>

        <ProfileClient
          initialFitnessLevel={onboarding.fitness_level}
          initialPrimaryGoal={onboarding.primary_goal}
          initialEquipment={onboarding.equipment as string[]}
        />
      </div>
      <BottomNav />
    </div>
  )
}
