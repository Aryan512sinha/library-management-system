'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, Plus, X } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { SHIFTS, SEATS, type Assignment } from '@/lib/library-data'
import { admissionBeforeExpiry, calculateExpiryDate } from '@/lib/date-utils'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export default function AssignmentPanel({
  seatNo,
  shiftId,
  assignments,
  onClose,
  onSaved,
  role,
}: {
  seatNo: string
  shiftId: string
  assignments: Assignment[]
  onClose: () => void
  onSaved: () => Promise<void>
  role?: 'admin' | 'student'
}) {
  const isAdmin = role === 'admin'
  const existing = assignments.find(
    (item) => item.seatNo === seatNo && item.shiftIds?.includes(shiftId),
  )

  const [seatNoValue, setSeatNoValue] = useState(seatNo)
  const [studentName, setStudentName] = useState(existing?.studentName ?? '')
  const [billNo, setBillNo] = useState(existing?.billNo ?? '')
  const [admissionDate, setAdmissionDate] = useState(existing?.admissionDate ?? '')
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ?? '')
  const [expiryManual, setExpiryManual] = useState(false)
  const [mobileNo, setMobileNo] = useState(existing?.mobileNo ?? '')
  const [amountDue, setAmountDue] = useState(existing?.amountDue?.toString() ?? '0')
  const [amountPaid, setAmountPaid] = useState(existing?.amountPaid?.toString() ?? '0')
  const [dueStatus, setDueStatus] = useState<'paid' | 'partial' | 'due'>(
    existing?.dueStatus ?? 'paid',
  )
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>(
    existing?.paymentMode ?? 'cash',
  )
  const [selectedShifts, setSelectedShifts] = useState<string[]>(
    existing?.shiftIds ?? [shiftId],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  const trapRef = useFocusTrap(visible && !closing)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  useEffect(() => {
    if (!visible || closing) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [visible, closing])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      onClose()
    }, 150)
  }

  const handleAdmissionChange = (value: string) => {
    setAdmissionDate(value)
    if (isAdmin && !expiryManual && value) {
      setExpiryDate(calculateExpiryDate(value))
    }
  }

  const handleExpiryChange = (value: string) => {
    setExpiryDate(value)
    setExpiryManual(true)
  }

  const handleSeatNoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeatNoValue(event.target.value.replace(/\D/g, ''))
  }

  const handleSave = async () => {
    if (!studentName.trim() || !billNo.trim()) {
      setError('Student name and bill number are required.')
      return
    }

    const trimmedSeat = seatNoValue.trim()
    const seatNum = parseInt(trimmedSeat, 10)
    if (!trimmedSeat || isNaN(seatNum) || seatNum < 1 || seatNum > SEATS.length) {
      setError(`Please enter a valid seat number (1-${SEATS.length}).`)
      return
    }

    const cleanMobile = mobileNo.replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.')
      return
    }

    if (selectedShifts.length === 0) {
      setError('Please select at least one shift.')
      return
    }

    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    if (!admissionBeforeExpiry(admissionDate, expiryDate)) {
      setError('Admission date must be before or equal to expiry date.')
      return
    }

    // Prevent double-booking: block if another assignment already occupies
    // the target seat during an overlapping shift.
    const conflict = assignments.find(
      (item) =>
        item.id !== existing?.id &&
        item.seatNo === trimmedSeat &&
        item.shiftIds?.some((id) => selectedShifts.includes(id)),
    )
    if (conflict) {
      setError(
        `Seat ${trimmedSeat} is already assigned to ${conflict.studentName} in an overlapping shift.`,
      )
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
      seatNo: trimmedSeat,
      studentName: studentName.trim(),
      billNo: billNo.trim(),
      shiftIds: selectedShifts,
      admissionDate,
      expiryDate,
      mobileNo: cleanMobile,
      amountDue: finalAmountDue,
      amountPaid: finalAmountPaid,
      dueStatus,
      paymentMode,
    }

    try {
      if (existing?.id) {
        await updateDoc(doc(db, 'assignments', existing.id), assignmentData)
      } else {
        await addDoc(collection(db, 'assignments'), assignmentData)
      }

      await onSaved()
      handleClose()
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
      handleClose()
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

  const seatDigits = seatNoValue.trim()
  const seatNumParsed = parseInt(seatDigits, 10)
  const seatHasError =
    seatDigits.length !== 0 &&
    (isNaN(seatNumParsed) || seatNumParsed < 1 || seatNumParsed > SEATS.length)

  const inputClasses = cn(
    'mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm',
    'outline-none transition duration-150 focus:border-primary focus:ring-4 focus:ring-primary/10',
  )

  return (
    <div
      className={cn(
        'fixed inset-0 z-30 flex items-end justify-end bg-foreground/20 backdrop-blur-[2px] sm:items-stretch transition-opacity duration-150',
        visible && !closing ? 'opacity-100' : 'opacity-0',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Assignment panel for seat ${seatNo}`}
    >
      <div
        ref={trapRef}
        className={cn(
          'flex w-full max-h-[100dvh] max-w-lg flex-col overflow-y-auto border-l border-border bg-card p-6 shadow-2xl sm:max-h-none sm:p-8',
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
            onClick={handleClose}
            aria-label="Close panel"
            className={cn(
              'grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground icon-button',
              'hover:bg-destructive/10 hover:text-destructive',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            )}
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
            aria-hidden="true"
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
          {isAdmin && (
            <>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-seat-no">
                Seat number
              </label>
              <input
                id="panel-seat-no"
                value={seatNoValue}
                onChange={handleSeatNoChange}
                inputMode="numeric"
                maxLength={3}
                placeholder={`1-${SEATS.length}`}
                className={cn(inputClasses, seatHasError && 'border-destructive')}
              />
              {seatHasError && (
                <p className="mt-1 -mt-3 text-xs text-destructive" role="alert">
                  Please enter a valid seat number (1-{SEATS.length})
                </p>
              )}
              {existing && seatDigits && seatDigits !== seatNo && !seatHasError && (
                <p className="mt-1 -mt-3 text-xs text-muted-foreground">
                  This will move the student from seat {seatNo} to seat {seatDigits}.
                </p>
              )}
            </>
          )}

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-student-name">
            Student name
          </label>
          <input
            id="panel-student-name"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="Full name"
            className={inputClasses}
            readOnly={!isAdmin}
          />

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-bill-no">
            Bill number
          </label>
          <input
            id="panel-bill-no"
            value={billNo}
            onChange={(event) => setBillNo(event.target.value)}
            placeholder="KL-0001"
            className={inputClasses}
            readOnly={!isAdmin}
          />

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-mobile">
            Mobile number
          </label>
          <input
            id="panel-mobile"
            value={mobileNo}
            onChange={handleMobileChange}
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            className={cn(inputClasses, mobileHasError && 'border-destructive')}
            readOnly={!isAdmin}
          />
          {mobileHasError && (
            <p className="mt-1 -mt-3 text-xs text-destructive" role="alert">
              Mobile number must be exactly 10 digits
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-admission">
                Admission date
              </label>
              <input
                id="panel-admission"
                type="date"
                value={admissionDate}
                onChange={(event) => handleAdmissionChange(event.target.value)}
                className={inputClasses}
                readOnly={!isAdmin}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-expiry">
                Expiry date
              </label>
              <input
                id="panel-expiry"
                type="date"
                value={expiryDate}
                onChange={(event) => handleExpiryChange(event.target.value)}
                className={inputClasses}
                readOnly={!isAdmin}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shift(s)
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select shifts">
              {SHIFTS.map((shift) => {
                const active = selectedShifts.includes(shift.id)
                return (
                  <button
                    type="button"
                    key={shift.id}
                    onClick={() => {
                      if (!isAdmin) return
                      setSelectedShifts((prev) =>
                        prev.includes(shift.id)
                          ? prev.filter((id) => id !== shift.id)
                          : [...prev, shift.id],
                      )
                    }}
                    aria-pressed={active}
                    disabled={!isAdmin}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left transition duration-150',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted',
                      !isAdmin && 'opacity-70 cursor-not-allowed',
                    )}
                  >
                    <span className="block text-sm font-medium">{shift.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{shift.displayTime}</span>
                  </button>
                )
              })}
            </div>
            {selectedShifts.length === 0 && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                Please select at least one shift
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-due-status">
              Payment status
            </label>
            <select
              id="panel-due-status"
              value={dueStatus}
              onChange={(event) => setDueStatus(event.target.value as 'paid' | 'partial' | 'due')}
              className={inputClasses}
              disabled={!isAdmin}
            >
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment mode
            </p>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Payment mode">
              {(['cash', 'online'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => {
                    if (!isAdmin) return
                    setPaymentMode(mode)
                  }}
                  role="radio"
                  aria-checked={paymentMode === mode}
                  disabled={!isAdmin}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    paymentMode === mode
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted',
                    !isAdmin && 'opacity-70 cursor-not-allowed',
                  )}
                >
                  {mode === 'cash' ? 'Cash' : 'Online'}
                </button>
              ))}
            </div>
          </div>

          {dueStatus === 'paid' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-amount-paid">
                Amount paid
              </label>
              <input
                id="panel-amount-paid"
                type="number"
                min="0"
                value={amountPaid}
                onChange={handleAmountPaidChange}
                className={inputClasses}
                readOnly={!isAdmin}
              />
            </div>
          )}

          {dueStatus === 'due' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-amount-due">
                Amount due
              </label>
              <input
                id="panel-amount-due"
                type="number"
                min="0"
                value={amountDue}
                onChange={handleAmountDueChange}
                className={inputClasses}
                readOnly={!isAdmin}
              />
            </div>
          )}

          {dueStatus === 'partial' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-amount-paid-partial">
                  Amount paid
                </label>
                <input
                  id="panel-amount-paid-partial"
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={handleAmountPaidChange}
                  className={inputClasses}
                  readOnly={!isAdmin}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="panel-amount-remaining">
                  Amount remaining
                </label>
                <input
                  id="panel-amount-remaining"
                  type="number"
                  min="0"
                  value={amountDue}
                  onChange={handleAmountDueChange}
                  className={inputClasses}
                  readOnly={!isAdmin}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger-subtle px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className={cn(
                'mt-3 h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground pressable',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            >
              {saving ? 'Saving...' : existing ? 'Update assignment' : 'Save assignment'}
            </button>
          )}

          {isAdmin && existing && (
            <button
              onClick={() => void handleDelete()}
              disabled={saving}
              className={cn(
                'h-11 rounded-xl border border-destructive/30 text-sm font-semibold text-destructive pressable',
                'hover:bg-destructive/5',
                'disabled:opacity-60',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
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