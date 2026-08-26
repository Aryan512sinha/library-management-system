'use client'

import {
  BookOpen,
  Bell,
  Clock3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import type { Assignment, Role } from '@/lib/library-data'
import { LibraryModelView } from '@/components/library-model'

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

export const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ')

/**
 * Maps a raw Firestore "assignments" doc into the typed Assignment shape.
 * Pulled out so both the login screen (to capture the matched student on
 * sign-in) and the student dashboard (to refresh their own record) share
 * exactly the same mapping logic.
 */
export function mapAssignmentDoc(
  snapshotDoc: QueryDocumentSnapshot<DocumentData>,
): Assignment {
  const docData = snapshotDoc.data()

  return {
    id: snapshotDoc.id,
    seatNo: docData.seatNo || '',
    studentName: docData.studentName || '',
    billNo: docData.billNo || '',
    shiftIds: docData.shiftIds || [],
    admissionDate: docData.admissionDate || '',
    expiryDate: docData.expiryDate || '',
    mobileNo: docData.mobileNo || '',
    dueStatus: docData.dueStatus || 'paid',
    amountPaid: docData.amountPaid ?? 0,
    amountDue: docData.amountDue ?? 0,
  } as Assignment
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <BookOpen className="size-5" />
      </div>
      <div>
        <p className="font-serif text-lg font-bold leading-none tracking-tight">
          KL Book House
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Library management
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

export function Stat({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
}: {
  icon: any
  label: string
  value: string
  detail: string
  tone?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="grid size-9 place-items-center rounded-xl bg-muted text-primary">
          <Icon className="size-4" />
        </div>

        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
            tone === 'warn'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {detail}
        </span>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Seat map wrapper
// ---------------------------------------------------------------------------

export function SeatMap({
  selectedSeat,
  onSelect,
}: {
  shiftId: string
  selectedSeat: string
  onSelect: (seat: string) => void
  readonly?: boolean
}) {
  return (
    <LibraryModelView
      onSelect={() => onSelect(selectedSeat)}
    />
  )
}

// ---------------------------------------------------------------------------
// App shell (sidebar + topbar) shared by both dashboards
// ---------------------------------------------------------------------------

export function AppShell({
  role,
  greetingName,
  onLogout,
  children,
}: {
  role: Role
  /** Text shown next to "Good morning," in the topbar, e.g. "Admin" or a student's first name */
  greetingName: string
  onLogout: () => void
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-card px-5 py-6 lg:flex">
        <Logo />

        <nav className="mt-12 flex flex-col gap-2">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">
            Workspace
          </p>

          <a className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-3 text-sm font-semibold text-primary">
            <LayoutDashboard className="size-4" />
            Overview
          </a>

          {role === 'admin' && (
            <>
              <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
                <Users className="size-4" />
                Students
              </a>

              <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
                <FileText className="size-4" />
                Payments & dues
              </a>
            </>
          )}

          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
            <Settings className="size-4" />
            Settings
          </a>
        </nav>

        <div className="mt-auto rounded-2xl bg-muted p-4">
          <p className="text-xs font-semibold">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Contact the support desk for account help.
          </p>

          <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
            Open help
            <ExternalLink className="size-3" />
          </button>
        </div>

        <button
          onClick={onLogout}
          className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <Menu className="size-5" />
            <Logo />
          </div>

          <div className="hidden lg:block">
            <p className="font-serif text-xl font-bold">
              Good morning, {greetingName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              KL Book House
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Search"
              className="hidden size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted sm:grid"
            >
              <Search className="size-4" />
            </button>

            <button
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </button>

            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {greetingName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

export { Clock3 }