'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Armchair,
  CalendarClock,
  Check,
  ChevronRight,
  IndianRupee,
  Phone,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import {
  SEATS,
  SHIFTS,
  getExpiryLabel,
  getExpiryTone,
  type Assignment,
} from '@/lib/library-data'
import { auth, db } from '@/lib/firebase'
import AssignmentPanel from './AssignmentPanel'
import { AppShell, Clock3, Stat, cn, mapAssignmentDoc } from './DashboardShared'

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

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

function dueMeta(item: Assignment) {
  if (item.dueStatus === 'paid') {
    return {
      label: 'Paid in full',
      icon: Check,
      chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      bar: 'bg-emerald-500',
    }
  }
  if (item.dueStatus === 'partial') {
    return {
      label: `₹${item.amountDue.toLocaleString('en-IN')} left`,
      icon: IndianRupee,
      chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      bar: 'bg-amber-500',
    }
  }
  return {
    label: `₹${item.amountDue.toLocaleString('en-IN')} due`,
    icon: IndianRupee,
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    bar: 'bg-rose-500',
  }
}

function expiryMeta(expiryDate: string) {
  const tone = getExpiryTone(expiryDate)
  const label = getExpiryLabel(expiryDate)

  if (tone === 'expired') {
    return {
      label,
      icon: CalendarClock,
      chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    }
  }
  if (tone === 'soon') {
    return {
      label,
      icon: CalendarClock,
      chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    }
  }
  return {
    label,
    icon: CalendarClock,
    chip: 'bg-muted text-muted-foreground ring-1 ring-border',
  }
}

// ---------------------------------------------------------------------------
// Student card
// ---------------------------------------------------------------------------

function StudentCard({
  item,
  onClick,
}: {
  item: Assignment
  onClick: () => void
}) {
  const due = dueMeta(item)
  const expiry = expiryMeta(item.expiryDate)
  const shiftLabel = (item.shiftIds ?? [])
    .map((id) => SHIFTS.find((s) => s.id === id)?.short)
    .filter(Boolean)
    .join(', ')

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
    >
      <span className={cn('h-1.5 w-full', due.bar)} aria-hidden="true" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground ring-4 ring-primary/10">
            {initials(item.studentName)}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate font-serif text-lg font-semibold leading-tight">
              {item.studentName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bill #{item.billNo}
            </p>
          </div>

          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <Armchair className="size-3.5 text-muted-foreground" />
            Seat {item.seatNo}
          </span>

          {shiftLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              <Clock3 className="size-3.5 text-muted-foreground" />
              {shiftLabel}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-4">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              due.chip,
            )}
          >
            <due.icon className="size-3.5" />
            {due.label}
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              expiry.chip,
            )}
          >
            <expiry.icon className="size-3.5" />
            {expiry.label}
          </span>
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StudentsPage({
  onBack,
  onLogout,
}: {
  /** Called when "Overview" is clicked in the sidebar — return to the admin dashboard. */
  onBack: () => void
  /** Called after signing out of Firebase — return to the login screen. */
  onLogout: () => void
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')

  const [panelOpen, setPanelOpen] = useState(false)
  const [activeSeat, setActiveSeat] = useState('1')
  const [activeShift, setActiveShift] = useState<string>(
    SHIFTS[0]?.id ?? 'morning',
  )

  const loadAssignments = async () => {
    if (!db) {
      setLoadError('Firestore is not configured.')
      setLoadingData(false)
      return
    }

    try {
      setLoadingData(true)
      setLoadError('')

      const snapshot = await getDocs(collection(db, 'assignments'))
      setAssignments(snapshot.docs.map(mapAssignmentDoc))
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setLoadError(
        'Could not load student data. Check your Firestore configuration and rules.',
      )
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void loadAssignments()
  }, [])

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      onLogout()
    }
  }

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return assignments

    return assignments.filter((item) =>
      [item.studentName, item.seatNo, item.billNo, item.mobileNo]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [assignments, searchTerm])

  const dues = useMemo(
    () => assignments.filter((item) => item.dueStatus !== 'paid'),
    [assignments],
  )

  const expiringSoon = useMemo(
    () => assignments.filter((item) => getExpiryTone(item.expiryDate) === 'soon'),
    [assignments],
  )

  const openStudent = (item: Assignment) => {
    setActiveSeat(item.seatNo)
    setActiveShift(item.shiftIds?.[0] ?? SHIFTS[0]?.id ?? 'morning')
    setPanelOpen(true)
  }

  const handleAddStudent = () => {
    const raw = window.prompt(`Enter a seat number to assign (1–${SEATS.length}):`)
    if (raw === null) return

    const trimmed = raw.trim()
    if (!/^\d+$/.test(trimmed)) {
      window.alert('Please enter a valid seat number.')
      return
    }

    const num = parseInt(trimmed, 10)
    if (num < 1 || num > SEATS.length) {
      window.alert(`Seat ${num} does not exist (valid range: 1–${SEATS.length}).`)
      return
    }

    setActiveSeat(String(num))
    setActiveShift(SHIFTS[0]?.id ?? 'morning')
    setPanelOpen(true)
  }

  const handleSaved = async () => {
    await loadAssignments()
  }

  return (
    <AppShell
      role="admin"
      greetingName="Admin"
      activeView="students"
      onNavigateOverview={onBack}
      onNavigateStudents={() => {}}
      onLogout={() => void handleLogout()}
    >
      <main className="mx-auto max-w-[1500px] p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
              Students
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Every student on record, with their seat, dues and renewal status.
            </p>
          </div>

          <button
            onClick={handleAddStudent}
            className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add student
          </button>
        </div>

        <div className="mt-6 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, seat, bill number or mobile"
            className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {loadError}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat
            icon={Users}
            label="Total students"
            value={String(assignments.length)}
            detail={`${SEATS.length} seats`}
          />
          <Stat
            icon={AlertCircle}
            label="Outstanding dues"
            value={String(dues.length)}
            detail="Needs follow-up"
            tone="warn"
          />
          <Stat
            icon={Phone}
            label="Renewals to watch"
            value={String(expiringSoon.length)}
            detail="Expiring soon"
            tone="warn"
          />
        </div>

        <div className="mt-8">
          {loadingData ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading students...
            </p>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No students match your search.' : 'No students yet.'}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <StudentCard
                  key={item.id ?? `${item.seatNo}-${item.billNo}`}
                  item={item}
                  onClick={() => openStudent(item)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {panelOpen && (
        <AssignmentPanel
          seatNo={activeSeat}
          shiftId={activeShift}
          assignments={assignments}
          onClose={() => setPanelOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}