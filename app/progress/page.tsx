import BottomNav from '@/app/dashboard/BottomNav'

export default function ProgressPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background)', maxWidth: '390px', margin: '0 auto' }}
    >
      <div className="flex-1 flex items-center justify-center pb-16">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Aquí verás tu progreso pronto
        </p>
      </div>
      <BottomNav />
    </div>
  )
}
