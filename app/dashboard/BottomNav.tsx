'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Hoy',
    Icon: ({ active }: { active: boolean }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progreso',
    Icon: ({ active }: { active: boolean }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Perfil',
    Icon: ({ active }: { active: boolean }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full"
      style={{
        maxWidth: '390px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-surface-raised)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-4 py-2"
              style={{
                color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              <Icon active={active} />
              <span style={{ fontSize: '0.65rem', fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
