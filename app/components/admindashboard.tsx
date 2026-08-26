'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Phone,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import {
  ADMIN_CONTACT,
  SEATS,
  SHIFTS,
  getExpiryLabel,
  getExpiryTone,
  type Assignment,
} from '@/lib/library-data'
import { auth, db } from '@/lib/firebase'
import AssignmentPanel from './AssignmentPanel'
import { AppShell, Clock3, SeatMap, Stat, mapAssignmentDoc } from './DashboardShared'

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [shiftId, setShiftId] = useState(SHIFTS[0]?.id ?? 'morning')
  const [selectedSeat, setSelectedSeat] = useState('1')
  const [panelOpen, setPanelOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [searchError, setSearchError] = useState('')

  // Seat numbers are plain numbers 1–57, matching SEATS[index].seatNo.
  const selectSeat = (raw: string) => {
    const trimmed = raw.trim()
    setSearchError('')

    if (!trimmed) {
      setSearchError('Please enter a seat number')
      return false
    }

    if (!/^\d+$/.test(trimmed)) {
      setSearchError('Please enter a valid seat number (1–57)')
      return false
    }

    const num = parseInt(trimmed, 10)
    if (num < 1 || num > SEATS.length) {
      setSearchError(
        `Seat ${num} does not exist (valid range: 1–${SEATS.length})`,
      )
      return false
    }

    setSelectedSeat(String(num))
    setPanelOpen(true)
    return true
  }

  const handleSearch = () => {
    if (selectSeat(searchTerm)) setSearchTerm('')
  }

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
        'Could not load library data. Check your Firestore configuration and rules.',
      )
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void loadAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const occupancy = useMemo(
    () =>
      assignments.filter((item) => item.shiftIds?.includes(shiftId) ?? false)
        .length,
    [assignments, shiftId],
  )

  const expiring = useMemo(
    () =>
      assignments.filter((item) => getExpiryTone(item.expiryDate) === 'soon'),
    [assignments],
  )

  const dues = useMemo(
    () => assignments.filter((item) => item.dueStatus !== 'paid'),
    [assignments],
  )

  const totalDue = useMemo(
    () => dues.reduce((total, item) => total + (item.amountDue || 0), 0),
    [dues],
  )

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

  const handleSaved = async () => {
    await loadAssignments()
    setSaved(true)
  }

  return (
    <AppShell role="admin" greetingName="Admin" onLogout={() => void handleLogout()}>
      <main className="mx-auto max-w-[1500px] p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
              Library overview
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage your real library data, seats, shifts, and payments.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
            <span className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              {loadingData ? 'Loading...' : 'Live Firestore data'}
            </span>

            <button
              onClick={() => void loadAssignments()}
              className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch()
                }}
                placeholder="Search by seat number (1–57)"
                className="h-12 w-full rounded-xl border border-transparent bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <button
              onClick={handleSearch}
              className="h-12 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Search
            </button>
          </div>
          {searchError && (
            <p className="mt-2 text-xs text-destructive">{searchError}</p>
          )}
        </div>

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {loadError}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={LayoutDashboard}
            label="Total seats"
            value={String(SEATS.length)}
            detail={`${SHIFTS.length} shifts`}
          />

          <Stat
            icon={Users}
            label={`Occupied in ${SHIFTS.find((s) => s.id === shiftId)?.name}`}
            value={String(occupancy)}
            detail={`${Math.round((occupancy / SEATS.length) * 100)}% full`}
          />

          <Stat
            icon={Clock3}
            label="Renewals to watch"
            value={String(expiring.length).padStart(2, '0')}
            detail="Needs action"
            tone="warn"
          />

          <Stat
            icon={CreditCard}
            label="Outstanding dues"
            value={`₹${totalDue.toLocaleString('en-IN')}`}
            detail={`${dues.length} students`}
            tone="warn"
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-bold">Seat map</h2>

                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Live
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select a seat to add, edit or remove an assignment.
                </p>
              </div>

              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {SHIFTS.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => {
                      setShiftId(shift.id)
                      setSelectedSeat('1')
                    }}
                    className={
                      shiftId === shift.id
                        ? 'rounded-lg bg-card px-3 py-2 text-xs font-semibold text-primary shadow-sm transition'
                        : 'rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground'
                    }
                  >
                    <span className="hidden sm:inline">{shift.name}</span>
                    <span className="sm:hidden">{shift.short}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <SeatMap
                shiftId={shiftId}
                selectedSeat={selectedSeat}
                onSelect={(seat) => selectSeat(seat)}
              />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{occupancy}</strong>{' '}
                occupied ·{' '}
                <strong className="text-foreground">
                  {SEATS.length - occupancy}
                </strong>{' '}
                vacant in{' '}
                <strong className="text-foreground">
                  {SHIFTS.find((s) => s.id === shiftId)?.name}
                </strong>{' '}
                shift
              </p>

              <button
                onClick={() => setPanelOpen(true)}
                className="flex items-center gap-2 text-xs font-semibold text-primary"
              >
                View selected seat
                <ArrowRight className="size-3" />
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold">
                  Renewals to watch
                </h2>

                <span className="text-xs font-semibold text-primary">
                  {expiring.length}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {expiring.length === 0 ? (
                  <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    No upcoming renewals.
                  </p>
                ) : (
                  expiring.slice(0, 5).map((item) => (
                    <div
                      key={item.id ?? item.billNo}
                      className="flex items-center gap-3"
                    >
                      <div className="grid size-9 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                        {item.studentName
                          .split(' ')
                          .map((name) => name[0])
                          .join('')
                          .slice(0, 2)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {item.studentName}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Seat {item.seatNo} · {item.expiryDate}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-amber-700">
                        {getExpiryLabel(item.expiryDate)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold">
                  Outstanding dues
                </h2>

                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                  {dues.length} open
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {dues.length === 0 ? (
                  <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    No outstanding dues.
                  </p>
                ) : (
                  dues.map((item) => (
                    <div
                      key={item.id ?? item.billNo}
                      className="flex items-center justify-between rounded-xl bg-muted p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {item.studentName}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Seat {item.seatNo}
                        </p>
                      </div>

                      <strong className="text-sm text-amber-800">
                        ₹{item.amountDue.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold">
                  Shift occupancy
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Current utilization across the day
                </p>
              </div>

              <button
                onClick={() => void loadAssignments()}
                className="grid size-9 place-items-center rounded-lg bg-muted"
                aria-label="Refresh occupancy"
              >
                <ExternalLink className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {SHIFTS.map((shift) => {
                const count = assignments.filter(
                  (item) => item.shiftIds?.includes(shift.id) ?? false,
                ).length

                return (
                  <div key={shift.id} className="flex items-center gap-4">
                    <span className="w-20 text-xs font-semibold">
                      {shift.name}
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(
                            (count / SEATS.length) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>

                    <span className="w-16 text-right text-xs font-bold">
                      {count}/{SEATS.length}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary-foreground/70">
                  Quick action
                </p>

                <h2 className="mt-2 font-serif text-2xl font-bold">
                  Add a student.
                </h2>
              </div>

              <Plus className="size-5" />
            </div>

            <p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/75">
              Assign a vacant seat and save the student's details directly
              to Firestore.
            </p>

            <button
              onClick={() => {
                setSelectedSeat('1')
                setShiftId(SHIFTS[0]?.id ?? 'morning')
                setPanelOpen(true)
              }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-card px-4 py-3 text-xs font-bold text-primary"
            >
              Assign a seat
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-primary" />
              <h2 className="font-serif text-xl font-bold">
                Library support
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {ADMIN_CONTACT.hours} · {ADMIN_CONTACT.email}
            </p>
          </div>

          <a
            href={`tel:${ADMIN_CONTACT.phone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"
          >
            <Phone className="size-4" />
            {ADMIN_CONTACT.phone}
          </a>
        </div>
      </main>

      {panelOpen && (
        <AssignmentPanel
          seatNo={selectedSeat}
          shiftId={shiftId}
          assignments={assignments}
          onClose={() => setPanelOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-xl">
          <Check className="size-4 text-primary" />
          Assignment saved to Firestore

          <button onClick={() => setSaved(false)} aria-label="Close message">
            <X className="size-4" />
          </button>
        </div>
      )}
    </AppShell>
  )
}