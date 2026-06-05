'use client'

interface ExerciseImageProps {
  img0: string | null
  img1: string | null
  name: string
}

export default function ExerciseImage({ img0, img1, name }: ExerciseImageProps) {
  if (img0 && img1) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        <img
          src={img0}
          alt={name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
        <img
          src={img1}
          alt={name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
            opacity: 0,
            animation: 'exercise-flip 1.2s step-end infinite',
          }}
        />
        <style>{`
          @keyframes exercise-flip {
            0%, 49% { opacity: 0; }
            50%, 100% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (img0) {
    return (
      <div
        style={{
          borderRadius: '0.75rem',
          overflow: 'hidden',
          height: '240px',
        }}
      >
        <img
          src={img0}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        height: '240px',
        borderRadius: '0.75rem',
        backgroundColor: 'var(--color-surface-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{name}</span>
    </div>
  )
}
