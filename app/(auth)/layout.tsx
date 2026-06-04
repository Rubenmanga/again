export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span
            className="text-4xl font-bold tracking-tight select-none"
            style={{ color: 'var(--color-accent)', letterSpacing: '-0.02em' }}
          >
            AGAIN
          </span>
        </div>

        {children}
      </div>
    </div>
  )
}
