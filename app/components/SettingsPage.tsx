'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { ADMIN_CONTACT, type Assignment } from '@/lib/library-data'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'

type SettingsSection = 'profile' | 'security' | 'about'

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export default function SettingsPage({
  role,
  student,
  onLogout,
}: {
  role: 'admin' | 'student'
  student?: Assignment
  onLogout: () => void
}) {
  const [section, setSection] = useState<SettingsSection>('profile')
  const [signingOut, setSigningOut] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const displayName = role === 'admin' ? 'Admin' : (student?.studentName ?? 'Member')

  const handleLogout = async () => {
    setSigningOut(true)
    setNotice(null)
    try {
      if (auth) await signOut(auth)
      onLogout()
    } catch (error) {
      console.error('Logout failed:', error)
      setNotice({ type: 'error', text: 'Could not sign out. Please try again.' })
      setSigningOut(false)
    }
  }

  const navItem = (key: SettingsSection, label: string, icon: React.ReactNode, desc: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setSection(key)}
      aria-current={section === key ? 'page' : undefined}
      className={cn(
        'flex items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition duration-150',
        'pressable',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        section === key
          ? 'bg-primary/10 font-semibold text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block">{label}</span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{desc}</span>
      </span>
    </button>
  )

  const sectionNav = (
    <nav aria-label="Settings sections" className="flex flex-col gap-1.5">
      {navItem('profile', 'Profile', <User className="size-4" aria-hidden="true" />, 'Account details')}
      {navItem('security', 'Security', <ShieldCheck className="size-4" aria-hidden="true" />, 'Sign-in & access')}
      {navItem('about', 'About', <Info className="size-4" aria-hidden="true" />, 'App & support info')}
    </nav>
  )

  return (
    <>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">
        <div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your account, security and preferences.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className={cn(
              'mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm',
              notice.type === 'success'
                ? 'bg-success-subtle text-success'
                : 'bg-danger-subtle text-destructive',
            )}
          >
            {notice.type === 'success' ? (
              <Check className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1">{notice.text}</span>
            <button
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
              className="grid size-6 place-items-center rounded-lg hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Settings nav (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-3">
              {sectionNav}
            </div>
          </div>

          {/* Settings nav (mobile) - horizontal scroll */}
          <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-muted p-1">
              {[
                { key: 'profile' as const, label: 'Profile', icon: <User className="size-4" aria-hidden="true" /> },
                { key: 'security' as const, label: 'Security', icon: <ShieldCheck className="size-4" aria-hidden="true" /> },
                { key: 'about' as const, label: 'About', icon: <Info className="size-4" aria-hidden="true" /> },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSection(item.key)}
                  aria-current={section === item.key ? 'page' : undefined}
                  className={cn(
                    'flex min-w-[110px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition duration-150',
                    'pressable',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    section === item.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings content */}
          <div className="min-w-0" key={section}>
            {section === 'profile' && (
              <div className="settings-fade flex flex-col gap-6">
                {/* Profile card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xl font-bold text-primary-foreground ring-4 ring-primary/10" aria-hidden="true">
                      {initials(displayName)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-serif text-2xl font-bold">{displayName}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {role === 'admin' ? 'Administrator' : 'Library member'}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-6 flex flex-col gap-4 border-t border-border pt-6 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-4" aria-hidden="true" />
                        Account type
                      </dt>
                      <dd className="font-semibold capitalize">{role}</dd>
                    </div>
                    {role === 'student' && (
                      <>
                        <div className="flex justify-between gap-4">
                          <dt className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="size-4" aria-hidden="true" />
                            Bill number
                          </dt>
                          <dd className="font-semibold">{student?.billNo ?? '\u2014'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="size-4" aria-hidden="true" />
                            Seat
                          </dt>
                          <dd className="font-semibold">{student?.seatNo ?? '\u2014'}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>

                {/* About this account card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-serif text-lg font-bold">About this account</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {role === 'admin'
                      ? 'Administrator accounts manage seats, shifts, students, attendance and payments for KL Book House.'
                      : `Your account is linked to your library membership${student?.billNo ? ` (bill ${student.billNo})` : ''}. You can view your membership and payment details anytime.`}
                  </p>
                </div>
              </div>
            )}

            {section === 'security' && (
              <div className="settings-fade flex flex-col gap-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                        Account access
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {role === 'admin'
                          ? 'Signed in with Firebase Authentication. Your account is protected by your admin password.'
                          : 'You are signed in using your bill number and registered mobile number.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-serif text-lg font-bold">Sign out</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Sign out of this device when you are finished to keep your account secure.
                  </p>
                  <button
                    onClick={() => void handleLogout()}
                    disabled={signingOut}
                    className={cn(
                      'mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive',
                      'transition duration-150 hover:bg-destructive/5',
                      'disabled:opacity-60',
                      'pressable',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    )}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    {signingOut ? 'Signing out...' : 'Sign out of account'}
                  </button>
                </div>
              </div>
            )}

            {section === 'about' && (
              <div className="settings-fade flex flex-col gap-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                    <Info className="size-5 text-primary" aria-hidden="true" />
                    About KL Book House
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    A library management system for tracking seats, shifts, students, attendance and payments — built for the team that keeps KL Book House running.
                  </p>
                  <dl className="mt-5 flex flex-col gap-3 rounded-xl bg-muted p-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Version</dt>
                      <dd className="font-semibold">1.0.0</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Data</dt>
                      <dd className="font-semibold">Cloud Firestore</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
                    <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                    Library support
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {ADMIN_CONTACT.hours} &middot; {ADMIN_CONTACT.email}
                  </p>
                  <a
                    href={`tel:${ADMIN_CONTACT.phone}`}
                    className={cn(
                      'mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground',
                      'transition duration-150 hover:brightness-110',
                      'pressable',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    )}
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {ADMIN_CONTACT.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
