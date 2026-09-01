'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  Phone,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { SHIFTS, type Assignment } from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { AppShell, Stat, mapAssignmentDoc } from './DashboardShared'

export default function PaymentsDuePage({
  onLogout,
  onNavigateOverview,
  onNavigateStudents,
}: {
  onLogout: () => void
  onNavigateOverview: () => void
  onNavigateStudents: () => void
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<Assignment | null>(null)

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
      setLoadError('Could not load payment data. Check your Firestore configuration and rules.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void loadAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalCollected = useMemo(
    () => assignments.reduce((sum, item) => sum + (item.amountPaid || 0), 0),
    [assignments],
  )

  const totalCash = useMemo(
    () =>
      assignments
        .filter((item) => (item.paymentMode ?? 'cash') === 'cash')
        .reduce((sum, item) => sum + (item.amountPaid || 0), 0),
    [assignments],
  )

  const totalOnline = useMemo(
    () =>
      assignments
        .filter((item) => item.paymentMode === 'online')
        .reduce((sum, item) => sum + (item.amountPaid || 0), 0),
    [assignments],
  )

  const dues = useMemo(
    () => assignments.filter((item) => item.dueStatus !== 'paid'),
    [assignments],
  )

  const pct = (part: number) => {
    if (!totalCollected) return '0% of total'
    return Math.round((part / totalCollected) * 100) + '% of total'
  }

  const selectedPhoneHref = selected ? 'tel:' + selected.mobileNo : ''

  return (
    <AppShell
      role="admin"
      greetingName="Admin"
      activeView="payments"
      onNavigateOverview={onNavigateOverview}
      onNavigateStudents={onNavigateStudents}
      onNavigatePayments={() => {}}
      onLogout={onLogout}
    >
      <main className="mx-auto max-w-[1500px] p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
              Payments & dues
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Track collections by payment mode and follow up on outstanding dues.
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

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {loadError}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat
            icon={Wallet}
            label="Total collected"
            value={'Rs ' + totalCollected.toLocaleString('en-IN')}
            detail={assignments.length + ' students'}
          />
          <Stat
            icon={Banknote}
            label="Collected in cash"
            value={'Rs ' + totalCash.toLocaleString('en-IN')}
            detail={pct(totalCash)}
          />
          <Stat
            icon={Smartphone}
            label="Collected online"
            value={'Rs ' + totalOnline.toLocaleString('en-IN')}
            detail={pct(totalOnline)}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold">Students with dues</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap a student to see full payment details.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
              {dues.length} open
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dues.length === 0 ? (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                No outstanding dues. Everyone is paid up.
              </p>
            ) : (
              dues.map((item) => (
                <button
                  key={item.id ?? item.billNo}
                  onClick={() => setSelected(item)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary hover:bg-primary/5"
                >
                  <p className="text-sm font-semibold">{item.studentName}</p>
                  <p className="text-xs text-muted-foreground">{'Bill ' + item.billNo}</p>
                  <p className="text-xs text-muted-foreground">{item.mobileNo}</p>
                  <span className="mt-2 text-xs font-bold text-amber-700">
                    {'Rs ' + item.amountDue.toLocaleString('en-IN') + ' due'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-[2px]"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                  Due details
                </p>
                <h2 className="mt-2 font-serif text-2xl font-bold">
                  {selected.studentName}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Seat</p>
                <p className="font-semibold">{selected.seatNo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bill number</p>
                <p className="font-semibold">{selected.billNo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shift(s)</p>
                <p className="font-semibold">
                  {selected.shiftIds
                    .map((id) => SHIFTS.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{selected.dueStatus}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount paid</p>
                <p className="font-semibold">
                  {'Rs ' + selected.amountPaid.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount due</p>
                <p className="font-semibold text-amber-700">
                  {'Rs ' + selected.amountDue.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment mode</p>
                <p className="font-semibold capitalize">
                  {selected.paymentMode ?? 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiry</p>
                <p className="font-semibold">{selected.expiryDate || '-'}</p>
              </div>
            </div>

            <a
              href={selectedPhoneHref}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"
            >
              <Phone className="size-4" />
              {'Call ' + selected.mobileNo}
            </a>
          </div>
        </div>
      )}
    </AppShell>
  )
}