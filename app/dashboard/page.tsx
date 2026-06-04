export default function DashboardPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <h1
        className="text-3xl font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Welcome back
      </h1>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Dashboard coming in Phase 3
      </p>
    </div>
  )
}
