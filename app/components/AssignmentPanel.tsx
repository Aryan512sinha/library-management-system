'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, Plus, X } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { SHIFTS, type Assignment } from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { cn } from './DashboardShared'

export default function AssignmentPanel({
  seatNo,
  shiftId,
  assignments,
  onClose,
  onSaved,
}: {
  seatNo: string
  shiftId: string
  assignments: Assignment[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const existing = assignments.find(
    (item) => item.seatNo === seatNo && item.shiftIds?.includes(shiftId),
  )

  const [studentName, setStudentName] = useState(existing?.studentName ?? '')
  const [billNo, setBillNo] = useState(existing?.billNo ?? '')
  const [admissionDate, setAdmissionDate] = useState(existing?.admissionDate ?? '')
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ?? '')
  const [mobileNo, setMobileNo] = useState(existing?.mobileNo ?? '')
  const [amountDue, setAmountDue] = useState(existing?.amountDue?.toString() ?? '0')
  const [amountPaid, setAmountPaid] = useState(existing?.amountPaid?.toString() ?? '0')
  const [dueStatus, setDueStatus] = useState<'paid' | 'partial' | 'due'>(
    existing?.dueStatus ?? 'paid',
  )
  const [selectedShifts, setSelectedShifts] = useState<string[]>(
    existing?.shiftIds ?? [shiftId],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  const handleClose = async () => {
    setClosing(true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    onClose()
  }

  const handleSave = async () => {
    if (!studentName.trim() || !billNo.trim()) {
      setError('Student name and bill number are required.')
      return
    }

    const cleanMobile = mobileNo.replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits')
      return
    }

    if (selectedShifts.length === 0) {
      setError('Please select at least one shift')
      return
    }

    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setSaving(true)
    setError('')

    let finalAmountDue = Number(amountDue) || 0
    let finalAmountPaid = Number(amountPaid) || 0

    if (dueStatus === 'paid') {
      finalAmountDue = 0
    } else if (dueStatus === 'due') {
      finalAmountPaid = 0
    }

    const assignmentData = {
      seatNo,
      studentName: studentName.trim(),
      billNo: billNo.trim(),
      shiftIds: selectedShifts,
      admissionDate,
      expiryDate,
      mobileNo: cleanMobile,
      amountDue: finalAmountDue,
      amountPaid: finalAmountPaid,
      dueStatus,
    }

    try {
      if (existing?.id) {
        await updateDoc(doc(db, 'assignments', existing.id), assignmentData)
      } else {
        await addDoc(collection(db, 'assignments'), assignmentData)
      }

      await onSaved()
      await handleClose()
    } catch (saveError) {
      console.error('Failed to save assignment:', saveError)
      setError('Could not save the assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existing?.id || !db) return

    const confirmed = window.confirm(
      `Remove ${existing.studentName} from seat ${existing.seatNo}?`,
    )

    if (!confirmed) return

    setSaving(true)
    setError('')

    try {
      await deleteDoc(doc(db, 'assignments', existing.id))
      await onSaved()
      await handleClose()
    } catch (deleteError) {
      console.error('Failed to delete assignment:', deleteError)
      setError('Could not remove the assignment.')
    } finally {
      setSaving(false)
    }
  }

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = event.target.value.replace(/\D/g, '')
    setMobileNo(cleanValue.slice(0, 10))
  }

  const handleAmountDueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = event.target.value.replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    setAmountDue(parts.length > 2 ? parts[0] + '.' + parts[1] : cleanValue)
  }

  const handleAmountPaidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = event.target.value.replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    setAmountPaid(parts.length > 2 ? parts[0] + '.' + parts[1] : cleanValue)
  }

  const mobileDigits = mobileNo.replace(/\D/g, '')
  const mobileHasError = mobileDigits.length !== 0 && mobileDigits.length !== 10

  return (
    <div
      className={cn(
        'fixed inset-0 z-30 flex items-end justify-end bg-foreground/20 backdrop-blur-[2px] sm:items-stretch transition-opacity duration-200',
        visible && !closing ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-card p-6 shadow-2xl sm:p-8',
          visible && !closing && 'slide-in',
          closing && 'slide-out',
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
              Seat details
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold">{seatNo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedShifts
                .map((id) => SHIFTS.find((s) => s.id === id)?.name)
                .filter(Boolean)
                .join(', ') || 'No shift selected'}{' '}
              shift(s)
            </p>
          </div>

          <button
            onClick={() => void handleClose()}
            aria-label="Close panel"
            className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          className={cn(
            'mt-8 flex items-center gap-3 rounded-xl p-4',
            existing ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'grid size-9 place-items-center rounded-full',
              existing ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground',
            )}
          >
            {existing ? <Check className="size-4" /> : <Plus className="size-4" />}
          </span>

          <div>
            <p className="text-sm font-semibold">
              {existing ? 'Seat occupied' : 'Seat available'}
            </p>
            <p className="text-xs text-muted-foreground">
              {existing
                ? `Assigned to ${existing.studentName}`
                : 'Enter a student to assign this seat'}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Student name
            <input
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Full name"
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bill number
            <input
              value={billNo}
              onChange={(event) => setBillNo(event.target.value)}
              placeholder="KL-0001"
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mobile number
            <input
              value={mobileNo}
              onChange={handleMobileChange}
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              className={cn(
                'mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary',
                mobileHasError ? 'border-destructive' : 'border-input',
              )}
            />
            {mobileHasError && (
              <p className="mt-1 text-xs text-destructive">
                Mobile number must be exactly 10 digits
              </p>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admission date
              <input
                type="date"
                value={admissionDate}
                onChange={(event) => setAdmissionDate(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
              />
            </label>

            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expiry date
              <input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shift(s)
            <div className="mt-2 flex flex-wrap gap-2">
              {SHIFTS.map((shift) => {
                const active = selectedShifts.includes(shift.id)
                return (
                  <button
                    type="button"
                    key={shift.id}
                    onClick={() => {
                      setSelectedShifts((prev) =>
                        prev.includes(shift.id)
                          ? prev.filter((id) => id !== shift.id)
                          : [...prev, shift.id],
                      )
                    }}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left transition',
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <span className="block text-sm font-medium normal-case tracking-normal">
                      {shift.name}
                    </span>
                    <span className="block text-[11px] normal-case tracking-normal text-muted-foreground">
                      {shift.time}
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedShifts.length === 0 && (
              <p className="mt-1 text-xs normal-case tracking-normal text-destructive">
                Please select at least one shift
              </p>
            )}
          </div>

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment status
            <select
              value={dueStatus}
              onChange={(event) => setDueStatus(event.target.value as 'paid' | 'partial' | 'due')}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
            >
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </label>

          {dueStatus === 'paid' && (
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount paid
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={handleAmountPaidChange}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
              />
            </label>
          )}

          {dueStatus === 'due' && (
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount due
              <input
                type="number"
                min="0"
                value={amountDue}
                onChange={handleAmountDueChange}
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
              />
            </label>
          )}

          {dueStatus === 'partial' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount paid
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={handleAmountPaidChange}
                  className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount remaining
                <input
                  type="number"
                  min="0"
                  value={amountDue}
                  onChange={handleAmountDueChange}
                  className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary"
                />
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="mt-3 h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : existing ? 'Update assignment' : 'Save assignment'}
          </button>

          {existing && (
            <button
              onClick={() => void handleDelete()}
              disabled={saving}
              className="h-11 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
            >
              Remove assignment
            </button>
          )}
        </div>

        <p className="mt-auto pt-8 text-center text-xs leading-5 text-muted-foreground">
          {existing
            ? 'Changes are saved to Firestore.'
            : 'This assignment will be stored in Firestore.'}
        </p>
      </div>
    </div>
  )
}