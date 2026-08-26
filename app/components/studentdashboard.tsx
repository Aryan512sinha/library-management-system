'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CreditCard, LayoutDashboard, Phone, Users } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ADMIN_CONTACT, SHIFTS, getExpiryLabel, type Assignment } from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { AppShell, Clock3, SeatMap, Stat, mapAssignmentDoc } from './DashboardShared'

export function StudentDashboard({
  student,
  onLogout,
}: {
  /** The assignment record matched during login (billNo + mobileNo). */
  student: Assignment
  onLogout: () => void
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

      if (!snapshot.empty) {
        setRecord(mapAssignmentDoc(snapshot.docs[0]))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shiftId = record.shiftIds?.[0] ?? 'morning'

  return (
    <AppShell
      role="student"
      greetingName={record.studentName || 'Student'}
      onLogout={onLogout}
    >
      <main className="mx-auto max-w-[1500px] p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
              Your library overview
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              View your membership, seat and payment information.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
            <span className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              {loadingData ? 'Loading...' : 'Live Firestore data'}
            </span>

            <button
              onClick={() => void refresh()}
              className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold"
            >
              Refresh
            </button>
          </div>
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
            label="Your seat"
            value={record.seatNo || '—'}
            detail={record.shiftIds?.join(', ') || '—'}
          />

          <Stat
            icon={Clock3}
            label="Valid until"
            value={record.expiryDate || '—'}
            detail={getExpiryLabel(record.expiryDate)}
          />

          <Stat
            icon={CreditCard}
            label="Payment status"
            value={record.dueStatus === 'paid' ? 'Paid' : 'Due'}
            detail={
              record.amountDue
                ? `₹${record.amountDue.toLocaleString('en-IN')}`
                : 'No dues'
            }
            tone={record.dueStatus === 'paid' ? 'default' : 'warn'}
          />

          <Stat
            icon={Users}
            label="Student"
            value={record.studentName || '—'}
            detail={record.billNo || '—'}
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

          <aside className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Your membership
            </p>

            <h2 className="mt-2 font-serif text-2xl font-bold">
              {record.studentName || 'Student'}
            </h2>

            <div className="mt-6 flex flex-col gap-4 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Bill number</span>
                <strong>{record.billNo || '—'}</strong>
              </div>

              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Seat</span>
                <strong>{record.seatNo || '—'}</strong>
              </div>

              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Shift</span>
                <strong>
                  {record.shiftIds
                    ?.map((id) => SHIFTS.find((s) => s.id === id)?.name ?? id)
                    .join(', ') || '—'}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid until</span>
                <strong>{record.expiryDate || '—'}</strong>
              </div>
            </div>
          </aside>
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
    </AppShell>
  )
}