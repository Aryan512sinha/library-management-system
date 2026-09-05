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
  Inbox,
} from 'lucide-react'
import {
  SEATS,
  SHIFTS,
  getExpiryLabel,
  getExpiryTone,
  type Assignment,
} from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { getAssignments, getCachedAssignments } from '@/lib/client-data'
import AssignmentPanel from './AssignmentPanel'
import { Clock3, Stat } from './DashboardShared'

// ---------------------------------------------------------------------------
// Presentational helpers
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
      chip: 'bg-success-subtle text-success ring-1 ring-success/20',
      bar: 'bg-success',
    }
  }
  if (item.dueStatus === 'partial') {
    return {
      label: `\u20B9${item.amountDue.toLocaleString('en-IN')} left`,
      icon: IndianRupee,
      chip: 'bg-warning-subtle text-warning-foreground ring-1 ring-warning/20',
      bar: 'bg-warning',
    }
  }
  return {
    label: `\u20B9${item.amountDue.toLocaleString('en-IN')} due`,
    icon: IndianRupee,
    chip: 'bg-danger-subtle text-destructive ring-1 ring-destructive/20',
    bar: 'bg-destructive',
  }
}

function expiryMeta(expiryDate: string) {
  const tone = getExpiryTone(expiryDate)
  const label = getExpiryLabel(expiryDate)

  if (tone === 'expired') {
    return {
      label,
      icon: CalendarClock,
      chip: 'bg-danger-subtle text-destructive ring-1 ring-destructive/20',
    }
  }
  if (tone === 'soon') {
    return {
      label,
      icon: CalendarClock,
      chip: 'bg-warning-subtle text-warning-foreground ring-1 ring-warning/20',
    }
  }
  return {
    label,
    icon: CalendarClock,
    chip: 'bg-muted text-muted-foreground ring-1 ring-border',
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton for student cards
// ---------------------------------------------------------------------------

function StudentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="skeleton h-1.5 w-full" />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="skeleton size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="skeleton h-7 w-20 rounded-full" />
          <div className="skeleton h-7 w-16 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2 border-t border-dashed border-border pt-4">
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-7 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
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
      className={cn(
        'card-interactive group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <span className={cn('h-1.5 w-full', due.bar)} aria-hidden="true" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground ring-4 ring-primary/10" aria-hidden="true">
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

          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition duration-150 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <Armchair className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Seat {item.seatNo}
          </span>

          {shiftLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              <Clock3 className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {shiftLabel}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-4">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', due.chip)}>
            <due.icon className="size-3.5" aria-hidden="true" />
            {due.label}
          </span>

          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', expiry.chip)}>
            <expiry.icon className="size-3.5" aria-hidden="true" />
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

export default function StudentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => getCachedAssignments() ?? [])
  const [loadingData, setLoadingData] = useState(() => getCachedAssignments() === null)
  const [loadError, setLoadError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')

  const [panelOpen, setPanelOpen] = useState(false)
  const [activeSeat, setActiveSeat] = useState('1')
  const [activeShift, setActiveShift] = useState<string>(
    SHIFTS[0]?.id ?? 'morning',
  )

  const [addSeatInput, setAddSeatInput] = useState('')
  const [addSeatError, setAddSeatError] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)

  const loadAssignments = async () => {
    if (!db) {
      setLoadError('Firestore is not configured.')
      setLoadingData(false)
      return
    }

    try {
      if (getCachedAssignments() === null) {
        setLoadingData(true)
      }
      setLoadError('')

      const list = await getAssignments()
      if (list) setAssignments(list)
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

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return assignments

    return assignments.filter((item) =>
      [item.studentName, item.seatNo, item.billNo, item.mobileNo]
        .join(' ')
        .toLowerCase()
        .includes(q),
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
    if (!showAddInput) {
      setShowAddInput(true)
      setAddSeatInput('')
      setAddSeatError('')
      return
    }

    const trimmed = addSeatInput.trim()
    if (!/^\d+$/.test(trimmed)) {
      setAddSeatError('Please enter a valid seat number.')
      return
    }

    const num = parseInt(trimmed, 10)
    if (num < 1 || num > SEATS.length) {
      setAddSeatError(`Seat ${num} does not exist (1\u2013${SEATS.length}).`)
      return
    }

    setActiveSeat(String(num))
    setActiveShift(SHIFTS[0]?.id ?? 'morning')
    setPanelOpen(true)
    setShowAddInput(false)
    setAddSeatInput('')
    setAddSeatError('')
  }

  const handleSaved = async () => {
    await loadAssignments()
  }

  return (
    <>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Students
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Every student on record, with their seat, dues and renewal status.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className={cn('flex gap-2', showAddInput ? 'flex' : 'hidden')}>
              <input
                type="text"
                value={addSeatInput}
                onChange={(e) => { setAddSeatInput(e.target.value); setAddSeatError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddStudent(); if (e.key === 'Escape') { setShowAddInput(false); setAddSeatError('') } }}
                placeholder={`Seat 1\u2013${SEATS.length}`}
                aria-label="Enter seat number to assign"
                autoFocus
                className="h-12 w-32 rounded-xl border border-input bg-background px-3 text-sm outline-none transition duration-150 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                onClick={handleAddStudent}
                className={cn(
                  'h-12 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground',
                  'transition duration-150 hover:brightness-110 active:scale-[0.98]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                Assign
              </button>
              <button
                onClick={() => { setShowAddInput(false); setAddSeatInput(''); setAddSeatError('') }}
                className={cn(
                  'h-12 shrink-0 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-muted-foreground',
                  'transition duration-150 hover:bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                Cancel
              </button>
            </div>
            {addSeatError && showAddInput && (
              <p className="text-xs text-destructive" role="alert">{addSeatError}</p>
            )}
            {!showAddInput && (
              <button
                onClick={handleAddStudent}
                className={cn(
                  'flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground',
                  'transition duration-150 hover:brightness-110 active:scale-[0.98]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add student
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, seat, bill number or mobile"
            aria-label="Search students"
            className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-sm outline-none transition duration-150 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3" role="list" aria-label="Student statistics">
          <div role="listitem">
            <Stat icon={Users} label="Total students" value={String(assignments.length)} detail={`${SEATS.length} seats`} />
          </div>
          <div role="listitem">
            <Stat icon={AlertCircle} label="Outstanding dues" value={String(dues.length)} detail="Needs follow-up" tone="warn" />
          </div>
          <div role="listitem">
            <Stat icon={Phone} label="Renewals to watch" value={String(expiringSoon.length)} detail="Expiring soon" tone="warn" />
          </div>
        </div>

        <div className="mt-8" aria-live="polite">
          {loadingData ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <StudentCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Inbox className="mx-auto size-12 text-muted-foreground/40" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-foreground">
                {searchTerm ? 'No students match your search.' : 'No students yet.'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchTerm ? 'Try a different search term.' : 'Add a student to get started.'}
              </p>
            </div>
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
      </div>

      {panelOpen && (
        <AssignmentPanel
          seatNo={activeSeat}
          shiftId={activeShift}
          assignments={assignments}
          onClose={() => setPanelOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
