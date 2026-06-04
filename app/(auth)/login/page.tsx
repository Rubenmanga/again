'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login, loginWithMagicLink } from '../actions'

const inputClass =
  'w-full h-14 rounded-xl px-4 text-sm transition-colors duration-150 focus:outline-none focus:ring-2'

const inputStyle = {
  backgroundColor: 'var(--color-surface-raised)',
  color: 'var(--color-text-primary)',
  border: '1px solid rgba(255,255,255,0.06)',
  '--tw-ring-color': 'var(--color-accent)',
} as React.CSSProperties

export default function LoginPage() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, null)
  const [magicState, magicAction, isMagicPending] = useActionState(
    loginWithMagicLink,
    null
  )

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Sign in to continue your journey
        </p>
      </div>

      {/* Email + password form */}
      <form action={loginAction} className="space-y-3">
        {loginState?.error && (
          <p className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
            {loginState.error}
          </p>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className={inputClass}
          style={inputStyle}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className={inputClass}
          style={inputStyle}
        />

        <button type="submit" disabled={isLoginPending} className="btn-primary">
          {isLoginPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      </div>

      {/* Magic link form */}
      <form action={magicAction} className="space-y-3">
        {magicState?.error && (
          <p className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
            {magicState.error}
          </p>
        )}
        {magicState?.success && (
          <p className="rounded-xl px-4 py-3 text-sm text-green-400 bg-green-400/10 border border-green-400/20">
            Magic link sent — check your email.
          </p>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email for magic link"
          required
          autoComplete="email"
          className={inputClass}
          style={inputStyle}
        />

        <button type="submit" disabled={isMagicPending} className="btn-secondary">
          {isMagicPending ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
