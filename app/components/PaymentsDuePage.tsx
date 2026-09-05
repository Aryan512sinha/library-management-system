'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  Inbox,
  Phone,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react'
import { SHIFTS, type Assignment } from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { getAssignments, getCachedAssignments } from '@/lib/client-data'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Stat } from './DashboardShared'

export default function PaymentsDuePage() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => getCachedAssignments() ?? [])
  const [loadingData, setLoadingData] = useState(() => getCachedAssignments() === null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<Assignment | null>(null)

  const modalTrapRef = useFocusTrap(!!selected)

  const loadAssignments = async () => {
    if (!db) {
      setLoadError('Firestore is not configured.')
      setLoadingData(false)
      return
    }

    try {
      if (getCachedAssignments() === null) {
        setLoadingData(true)
      } else {
        setRefreshing(true)
      }
      setLoadError('')

      const list = await getAssignments()
      if (list) setAssignments(list)
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setLoadError('Could not load payment data. Check your Firestore configuration and rules.')
    } finally {
      setLoadingData(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadAssignments()
  }, [])

  useEffect(() => {
    if (selected) {
      document.body.classList.add('modal-open')
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelected(null)
      }
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.classList.remove('modal-open')
      }
    } else {
      document.body.classList.remove('modal-open')
    }
  }, [selected])

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
    <>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Payments & dues
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Track collections by payment mode and follow up on outstanding dues.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
            <span className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {refreshing ? 'Syncing...' : loadingData ? 'Loading...' : 'Live Firestore data'}
            </span>
            <button
              onClick={() => void loadAssignments()}
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

        <div className="mt-8 grid gap-4 sm:grid-cols-3" role="list" aria-label="Payment statistics">
          <div role="listitem">
            <Stat icon={Wallet} label="Total collected" value={'Rs ' + totalCollected.toLocaleString('en-IN')} detail={assignments.length + ' students'} />
          </div>
          <div role="listitem">
            <Stat icon={Banknote} label="Collected in cash" value={'Rs ' + totalCash.toLocaleString('en-IN')} detail={pct(totalCash)} />
          </div>
          <div role="listitem">
            <Stat icon={Smartphone} label="Collected online" value={'Rs ' + totalOnline.toLocaleString('en-IN')} detail={pct(totalOnline)} />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold">Students with dues</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap a student to see full payment details.
              </p>
            </div>
            <span className="rounded-full bg-warning-subtle px-2 py-1 text-[10px] font-bold text-warning-foreground" aria-label={`${dues.length} students with open dues`}>
              {dues.length} open
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
            {dues.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3 rounded-xl bg-muted p-8 text-center">
                <Inbox className="mx-auto size-10 text-muted-foreground/40" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No outstanding dues. Everyone is paid up.
                </p>
              </div>
            ) : (
              dues.map((item) => (
                <button
                  key={item.id ?? item.billNo}
                  onClick={() => setSelected(item)}
                  className={cn(
                    'card-interactive flex flex-col items-start gap-1 rounded-xl border border-border bg-background p-4 text-left',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  <p className="text-sm font-semibold">{item.studentName}</p>
                  <p className="text-xs text-muted-foreground">{'Bill ' + item.billNo}</p>
                  <p className="text-xs text-muted-foreground">{item.mobileNo}</p>
                  <span className="mt-2 text-xs font-bold text-warning-foreground">
                    {'Rs ' + item.amountDue.toLocaleString('en-IN') + ' due'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-[2px] fade-in"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Payment details for ${selected.studentName}`}
        >
          <div
            ref={modalTrapRef}
            className="modal-enter w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
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
                aria-label="Close dialog"
                className={cn(
                  'grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground transition duration-150',
                  'hover:bg-destructive/10 hover:text-destructive',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <X className="size-4" />
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Seat</dt>
                <dd className="font-semibold">{selected.seatNo}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Bill number</dt>
                <dd className="font-semibold">{selected.billNo}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Shift(s)</dt>
                <dd className="font-semibold">
                  {selected.shiftIds
                    .map((id) => SHIFTS.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="font-semibold capitalize">{selected.dueStatus}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount paid</dt>
                <dd className="font-semibold">
                  {'Rs ' + selected.amountPaid.toLocaleString('en-IN')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount due</dt>
                <dd className="font-semibold text-warning-foreground">
                  {'Rs ' + selected.amountDue.toLocaleString('en-IN')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Payment mode</dt>
                <dd className="font-semibold capitalize">
                  {selected.paymentMode ?? 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Expiry</dt>
                <dd className="font-semibold">{selected.expiryDate || '-'}</dd>
              </div>
            </dl>

            <a
              href={selectedPhoneHref}
              className={cn(
                'mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground',
                'transition duration-150 hover:brightness-110 active:scale-[0.98]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              <Phone className="size-4" aria-hidden="true" />
              {'Call ' + selected.mobileNo}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
