'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CreditCard, LayoutDashboard, Phone, Users } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ADMIN_CONTACT, SHIFTS, getExpiryLabel, type Assignment } from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { mapAssignmentDoc } from '@/lib/client-data'
import { Clock3, SeatMap, Stat } from './DashboardShared'

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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Your library overview
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              View your membership, seat and payment information.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
            <span className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {loadingData ? 'Loading...' : 'Live Firestore data'}
            </span>

            <button
              onClick={() => void refresh()}
              className={cn(
                'rounded-lg bg-muted px-3 py-2 text-xs font-semibold transition duration-150',
                'hover:bg-primary/10',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              Refresh
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="list" aria-label="Your membership details">
          <div role="listitem">
            <Stat icon={LayoutDashboard} label="Your seat" value={record.seatNo || '\u2014'} detail={record.shiftIds?.join(', ') || '\u2014'} />
          </div>
          <div role="listitem">
            <Stat icon={Clock3} label="Valid until" value={record.expiryDate || '\u2014'} detail={getExpiryLabel(record.expiryDate)} />
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:p-6" aria-label="Seat map">
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
                <dd className="font-semibold">{record.expiryDate || '\u2014'}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-serif text-xl font-bold">
                Library support
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {ADMIN_CONTACT.hours} &middot; {ADMIN_CONTACT.email}
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
          </a>
        </div>
      </div>
    </>
  )
}
