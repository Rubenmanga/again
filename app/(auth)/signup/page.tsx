'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '../actions'

const inputClass =
  'w-full h-14 rounded-xl px-4 text-sm transition-colors duration-150 focus:outline-none focus:ring-2'

const inputStyle = {
  backgroundColor: 'var(--color-surface-raised)',
  color: 'var(--color-text-primary)',
  border: '1px solid rgba(255,255,255,0.06)',
  '--tw-ring-color': 'var(--color-accent)',
} as React.CSSProperties

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signup, null)

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          ✉️
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Check your email
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          We sent a confirmation link to your inbox. Click it to activate your account and start your onboarding.
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Didn&apos;t get it? Check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Create your account
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Start your comeback today
        </p>
      </div>

      {/* Signup form */}
      <form action={action} className="space-y-3">
        {state?.error && (
          <p className="rounded-xl px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
            {state.error}
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
          autoComplete="new-password"
          minLength={6}
          className={inputClass}
          style={inputStyle}
        />

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Creating account…' : 'Get started'}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
