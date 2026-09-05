'use client'

import { useState, type FormEvent } from 'react'
import { AlertCircle, ArrowRight, Clock3, ShieldCheck, Users } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import type { Assignment, Role } from '@/lib/library-data'
import { auth, db } from '@/lib/firebase'
import { Logo, mapAssignmentDoc } from './DashboardShared'
import { cn } from '@/lib/utils'

export function Login({
  onLogin,
}: {
  onLogin: (role: Role, studentAssignment?: Assignment) => void
}) {
  const [role, setRole] = useState<Role>('admin')

  const [email, setEmail] = useState('admin@klbookhouse.in')
  const [password, setPassword] = useState('')

  const [billNo, setBillNo] = useState('')
  const [mobileNo, setMobileNo] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your admin email and password.')
      return
    }

    if (!auth) {
      setError('Firebase Authentication is not configured.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      onLogin('admin')
    } catch (err) {
      console.error('Admin login failed:', err)
      setError('Invalid admin email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentLogin = async () => {
    if (!billNo.trim() || !mobileNo.trim()) {
      setError('Please enter your bill number and registered mobile number.')
      return
    }

    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const studentQuery = query(
        collection(db, 'assignments'),
        where('billNo', '==', billNo.trim()),
        where('mobileNo', '==', mobileNo.trim()),
      )

      const snapshot = await getDocs(studentQuery)

      if (snapshot.empty) {
        setError('Bill number or mobile number is incorrect.')
        return
      }

      const matchedAssignment = mapAssignmentDoc(snapshot.docs[0])
      onLogin('student', matchedAssignment)
    } catch (err) {
      console.error('Student login failed:', err)
      setError('Unable to verify your details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (role === 'admin') {
      await handleAdminLogin()
    } else {
      await handleStudentLogin()
    }
  }

  const inputClasses = cn(
    'mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm',
    'outline-none transition duration-150',
    'focus:border-primary focus:ring-4 focus:ring-primary/10',
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_80%_10%,hsl(var(--accent)/.7),transparent_38%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-8 lg:px-12">
      <header className="flex items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Secure workspace
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-6xl items-center gap-10 py-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <section className="max-w-xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Today at the library
          </p>

          <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            A quieter way to run your{' '}
            <span className="text-primary">library.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            Know every seat, every shift, and every renewal at a glance. Built
            for the people who keep KL Book House moving.
          </p>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" aria-hidden="true" />
              57 seats
            </span>

            <span className="flex items-center gap-2">
              <Clock3 className="size-4 text-primary" aria-hidden="true" />
              4 daily shifts
            </span>

            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Secure access
            </span>
          </div>
        </section>

        <section
          className="rounded-3xl border border-border/70 bg-card p-6 shadow-2xl shadow-primary/5 sm:p-8 md:p-10"
          aria-labelledby="signin-heading"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">Welcome back</p>

            <h2 id="signin-heading" className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
              Sign in to your desk
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Admins use Firebase credentials. Students use their bill number
              and registered mobile number.
            </p>
          </div>

          {/* Admin / Student switch */}
          <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="Login type">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'admin'}
              aria-controls="login-form"
              onClick={() => {
                setRole('admin')
                setError('')
              }}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                role === 'admin'
                  ? 'bg-card text-foreground shadow-sm tab-active'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Login as Admin
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={role === 'student'}
              aria-controls="login-form"
              onClick={() => {
                setRole('student')
                setError('')
              }}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                role === 'student'
                  ? 'bg-card text-foreground shadow-sm tab-active'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Login as Student
            </button>
          </div>

          <form id="login-form" onSubmit={handleSubmit} noValidate>
            {role === 'admin' ? (
              <>
                <label className="mt-7 block text-sm font-medium" htmlFor="login-email">
                  Admin email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@klbookhouse.in"
                  autoComplete="username"
                  className={inputClasses}
                />

                <label className="mt-5 block text-sm font-medium" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={inputClasses}
                />
              </>
            ) : (
              <>
                <label className="mt-7 block text-sm font-medium" htmlFor="login-bill">
                  Bill number
                </label>
                <input
                  id="login-bill"
                  type="text"
                  value={billNo}
                  onChange={(event) => setBillNo(event.target.value)}
                  placeholder="KL-1048"
                  autoComplete="off"
                  className={inputClasses}
                />

                <label className="mt-5 block text-sm font-medium" htmlFor="login-mobile">
                  Registered mobile number
                </label>
                <input
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  value={mobileNo}
                  onChange={(event) => setMobileNo(event.target.value)}
                  placeholder="9876543210"
                  autoComplete="tel"
                  className={inputClasses}
                />
              </>
            )}

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-4 flex items-center gap-2 rounded-xl bg-danger-subtle px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl',
                'bg-primary text-sm font-semibold text-primary-foreground',
                'shadow-lg shadow-primary/20 transition duration-150',
                'hover:brightness-110 active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              {loading
                ? 'Checking...'
                : role === 'admin'
                  ? 'Continue as admin'
                  : 'Continue as student'}

              {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            {role === 'admin'
              ? 'Only the two administrator accounts created in Firebase can access the admin dashboard.'
              : 'Use the bill number and mobile number registered with the library.'}
          </p>
        </section>
      </div>
    </main>
  )
}
