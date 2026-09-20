'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, ArrowUpRight, CheckCircle2, CreditCard, LayoutDashboard, Phone, Sparkles, Users } from 'lucide-react'
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import { ADMIN_CONTACT, SHIFTS, type Assignment, type AttendanceRecord } from '@/lib/library-data'
import { formatDate } from '@/lib/date-utils'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { mapAssignmentDoc } from '@/lib/client-data'
import { Clock3, SeatMap, Stat } from './DashboardShared'

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function AttendanceGrid({ record }: { record: Assignment }) {
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !record.seatNo || record.shiftIds.length === 0) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('seatNo', '==', record.seatNo),
    )

    const unsubscribe = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const next: Record<string, boolean> = {}
        snapshot.forEach((snapshotDoc) => {
          const item = snapshotDoc.data() as AttendanceRecord
          if (record.shiftIds.includes(item.shiftId)) {
            next[item.date] = item.present
          }
        })
        setAttendance(next)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Attendance listener error:', snapshotError)
        setError('Could not load your attendance right now.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [record.seatNo, record.shiftIds])

  const admissionDate = parseDateKey(record.admissionDate)
  const expiryDate = parseDateKey(record.expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = admissionDate ?? today
  const lastDay = expiryDate && expiryDate >= firstDay ? expiryDate : firstDay
  const days = Array.from(
    { length: Math.floor((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1 },
    (_, index) => addDays(firstDay, index),
  )
  const weekCount = Math.ceil(days.length / 7)
  const presentCount = days.filter((day) => attendance[dateKey(day)] === true).length
  const completedMembershipDays = days.filter((day) => day <= today).length
  const attendanceRate = completedMembershipDays
    ? Math.round((presentCount / completedMembershipDays) * 100)
    : 0

  return (
    <section className="mt-6 w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm" aria-label="Attendance history">
      <div className="border-b border-border bg-gradient-to-r from-primary/[0.08] via-card to-card px-5 py-5 lg:px-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight">Attendance rhythm</h2>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Live
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(record.admissionDate)} to {formatDate(record.expiryDate)} across {record.shiftIds.length > 1 ? 'your shifts' : 'your shift'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1.5 font-bold text-primary">{attendanceRate}% attendance</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-success" aria-hidden="true" /> Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-destructive" aria-hidden="true" /> Absent
          </span>
        </div>
      </div>
      </div>

      {error ? (
        <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-destructive lg:mx-7" role="alert">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : loading ? (
        <div className="mx-5 mt-5 flex items-center justify-center rounded-xl border border-border bg-muted/40 px-4 py-12 text-sm text-muted-foreground lg:mx-7" role="status">
          Loading attendance...
        </div>
      ) : (
        <div className="mx-5 mt-5 overflow-x-auto pb-1 lg:mx-7">
          <div className="w-full min-w-[280px]">
            <div
              className="mb-2 grid grid-flow-col justify-between gap-1.5 text-[10px] text-muted-foreground"
              style={{ gridTemplateColumns: `repeat(${weekCount}, 14px)` }}
            >
              {Array.from({ length: weekCount }, (_, week) => {
                const monthDay = days[week * 7]
                return (
                  <span key={dateKey(monthDay)} className="truncate">
                    {monthDay.toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                )
              })}
            </div>
            <div
              className="grid grid-flow-col grid-rows-7 justify-between gap-1.5"
              style={{ gridTemplateColumns: `repeat(${weekCount}, 14px)` }}
              role="grid"
              aria-label={`Attendance grid from ${formatDate(record.admissionDate)} to ${formatDate(record.expiryDate)}`}
            >
              {days.map((day) => {
                const key = dateKey(day)
                const isFuture = day > today
                const present = attendance[key] === true
                const status = isFuture ? 'not applicable' : present ? 'present' : 'absent'

                return (
                  <div
                    key={key}
                    role="gridcell"
                    title={`${formatDay(day)}: ${status}`}
                    aria-label={`${formatDay(day)}: ${status}`}
                    className={cn(
                      'size-[14px] rounded-[3px] border transition-colors',
                      status === 'present' && 'border-success/20 bg-success',
                      status === 'absent' && 'border-destructive/20 bg-destructive',
                      status === 'not applicable' && 'border-border bg-muted',
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      <p className="mx-5 mb-5 mt-4 flex items-center gap-2 text-xs text-muted-foreground lg:mx-7 lg:mb-6">
        <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
        Attendance updates automatically when the library marks your seat.
      </p>
    </section>
  )
}

export function StudentDashboard({
  student,
  onIdentityChange,
}: {
  student: Assignment
  onIdentityChange?: (record: Assignment) => void
}) {
  const [record, setRecord] = useState<Assignment>(student)
  const [loadingData, setLoadingData] = useState(false)
  const [loadError, setLoadError] = useState('')

  const refresh = async () => {
    if (!db) {
      setLoadError('Firestore is not configured.')
      return
    }

    try {
      setLoadingData(true)
      setLoadError('')

      const studentQuery = query(
        collection(db, 'assignments'),
        where('billNo', '==', record.billNo),
        where('mobileNo', '==', record.mobileNo),
      )

      const snapshot = await getDocs(studentQuery)

      if (!snapshot.empty && snapshot.docs[0]) {
        const next = mapAssignmentDoc(snapshot.docs[0])
        setRecord(next)
        onIdentityChange?.(next)
      }
    } catch (error) {
      console.error('Failed to refresh assignment:', error)
      setLoadError('Could not refresh your library data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const shiftId = record.shiftIds?.[0] ?? 'morning'

  return (
    <>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/10 sm:p-8">
          <div className="absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute bottom-[-5rem] right-24 size-40 rounded-full bg-accent/20 blur-2xl" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary-foreground/70">
              <Sparkles className="size-4" aria-hidden="true" />
              Student dashboard
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {record.studentName?.split(' ')[0] || 'student'}
            </h1>

            <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">
              Your quiet corner is ready. Keep an eye on your seat, membership and attendance in one place.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm sm:self-auto">
            <span className="px-2 text-xs font-semibold text-primary-foreground/80">
              {loadingData ? 'Loading...' : 'Live Firestore data'}
            </span>

            <button
              onClick={() => void refresh()}
              className={cn(
                'rounded-xl bg-card px-3 py-2 text-xs font-bold text-primary transition duration-150',
                'hover:brightness-105',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              Refresh
            </button>
          </div>
        </div>
        </div>

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="list" aria-label="Your membership details">
          <div role="listitem">
            <Stat icon={LayoutDashboard} label="Your seat" value={record.seatNo || '\u2014'} detail={record.shiftIds?.join(', ') || '\u2014'} />
          </div>
          <div role="listitem">
            <Stat
              icon={Clock3}
              label="Valid until"
              value={formatDate(record.expiryDate) || '\u2014'}
              detail="Membership expiry"
            />
          </div>
          <div role="listitem">
            <Stat
              icon={CreditCard}
              label="Payment status"
              value={record.dueStatus === 'paid' ? 'Paid' : 'Due'}
              detail={record.amountDue ? `\u20B9${record.amountDue.toLocaleString('en-IN')}` : 'No dues'}
              tone={record.dueStatus === 'paid' ? 'default' : 'warn'}
            />
          </div>
          <div role="listitem">
            <Stat icon={Users} label="Student" value={record.studentName || '\u2014'} detail={record.billNo || '\u2014'} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm lg:p-6" aria-label="Seat map">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-bold">Seat map</h2>

                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Live
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  View your assigned seat.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <SeatMap
                shiftId={shiftId}
                selectedSeat={record.seatNo}
                onSelect={() => {}}
                readonly
              />
            </div>
          </section>

          <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Your membership
            </p>

            <h2 className="mt-2 font-serif text-2xl font-bold">
              {record.studentName || 'Student'}
            </h2>

            <dl className="mt-6 flex flex-col gap-4 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Bill number</dt>
                <dd className="font-semibold">{record.billNo || '\u2014'}</dd>
              </div>

              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Seat</dt>
                <dd className="font-semibold">{record.seatNo || '\u2014'}</dd>
              </div>

              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Shift</dt>
                <dd className="font-semibold">
                  {record.shiftIds
                    ?.map((id) => SHIFTS.find((s) => s.id === id)?.name ?? id)
                    .join(', ') || '\u2014'}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-muted-foreground">Valid until</dt>
                <dd className="font-semibold">{formatDate(record.expiryDate) || '\u2014'}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <AttendanceGrid record={record} />

        <div className="mt-6 flex flex-col justify-between gap-5 rounded-3xl border border-primary/10 bg-gradient-to-r from-primary/[0.08] to-card p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-serif text-xl font-bold">
                Need a hand?
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              The library desk is available {ADMIN_CONTACT.hours.toLowerCase()}.
            </p>
          </div>

          <a
            href={`tel:${ADMIN_CONTACT.phone}`}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground',
              'transition duration-150 hover:brightness-110 active:scale-[0.98]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            )}
          >
            <Phone className="size-4" aria-hidden="true" />
            {ADMIN_CONTACT.phone}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </>
  )
}
