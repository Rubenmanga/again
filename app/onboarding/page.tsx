export default function OnboardingPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <h1
        className="text-3xl font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Let&apos;s get to know you
      </h1>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Onboarding flow coming in Phase 3
      </p>
    </div>
  )
}
