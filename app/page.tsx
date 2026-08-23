'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  ADMIN_CONTACT,
  SEATS,
  SHIFTS,
  getExpiryLabel,
  getExpiryTone,
  type Assignment,
  type Role,
  type ViewMode,
} from '@/lib/library-data'
import { auth, db } from '@/lib/firebase'
import { LibraryModelView } from '@/components/library-model'

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ')

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <BookOpen className="size-5" />
      </div>
      <div>
        <p className="font-serif text-lg font-bold leading-none tracking-tight">
          KL Book House
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Library management
        </p>
      </div>
    </div>
  )
}

function Login({
  onLogin,
}: {
  onLogin: (role: Role) => void
}) {
  const [role, setRole] = useState<Role>('admin')

  const [email, setEmail] = useState('admin@klbookhouse.in')
  const [password, setPassword] = useState('')

  const [billNo, setBillNo] = useState('')
  const [mobileNo, setMobileNo] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your admin email and password.')
      return
    }

    if (!auth) {
      setError('Firebase Authentication is not configured.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      onLogin('admin')
    } catch (error) {
      console.error('Admin login failed:', error)
      setError('Invalid admin email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentLogin = async () => {
    if (!billNo.trim() || !mobileNo.trim()) {
      setError('Please enter your bill number and registered mobile number.')
      return
    }

    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const studentQuery = query(
        collection(db, 'assignments'),
        where('billNo', '==', billNo.trim()),
        where('mobileNo', '==', mobileNo.trim()),
      )

      const snapshot = await getDocs(studentQuery)

      if (snapshot.empty) {
        setError('Bill number or mobile number is incorrect.')
        return
      }

      // The student dashboard is loaded separately from Firestore.
      // Successful matching means the student credentials are valid.
      onLogin('student')
    } catch (error) {
      console.error('Student login failed:', error)
      setError('Unable to verify your details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (role === 'admin') {
      await handleAdminLogin()
    } else {
      await handleStudentLogin()
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_80%_10%,hsl(var(--accent)/.7),transparent_38%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-8 lg:px-12">
      <header className="flex items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <ShieldCheck className="size-4 text-primary" />
          Secure workspace
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-6xl items-center gap-16 py-10 lg:grid-cols-[1.08fr_.92fr]">
        <section className="max-w-xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Today at the library
          </p>

          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
            A quieter way to run your{' '}
            <span className="text-primary">library.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            Know every seat, every shift, and every renewal at a glance. Built
            for the people who keep KL Book House moving.
          </p>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              57 seats
            </span>

            <span className="flex items-center gap-2">
              <Clock3 className="size-4 text-primary" />
              4 daily shifts
            </span>

            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Secure access
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-2xl shadow-primary/5 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">Welcome back</p>

            <h2 className="mt-2 font-serif text-3xl font-bold">
              Sign in to your desk
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Admins use Firebase credentials. Students use their bill number
              and registered mobile number.
            </p>
          </div>

          {/* Admin / Student switch */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setRole('admin')
                setError('')
              }}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition',
                role === 'admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Login as Admin
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('student')
                setError('')
              }}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition',
                role === 'student'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Login as Student
            </button>
          </div>

          {role === 'admin' ? (
            <>
              <label className="mt-7 block text-sm font-medium">
                Admin email address

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@klbookhouse.in"
                  autoComplete="username"
                  className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label className="mt-5 block text-sm font-medium">
                Password

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleSubmit()
                    }
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
            </>
          ) : (
            <>
              <label className="mt-7 block text-sm font-medium">
                Bill number

                <input
                  type="text"
                  value={billNo}
                  onChange={(event) => setBillNo(event.target.value)}
                  placeholder="KL-1048"
                  autoComplete="off"
                  className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label className="mt-5 block text-sm font-medium">
                Registered mobile number

                <input
                  type="tel"
                  value={mobileNo}
                  onChange={(event) => setMobileNo(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleSubmit()
                    }
                  }}
                  placeholder="9876543210"
                  autoComplete="tel"
                  className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
            </>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Checking...'
              : role === 'admin'
                ? 'Continue as admin'
                : 'Continue as student'}

            {!loading && <ArrowRight className="size-4" />}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            {role === 'admin'
              ? 'Only the two administrator accounts created in Firebase can access the admin dashboard.'
              : 'Use the bill number and mobile number registered with the library.'}
          </p>
        </section>
      </div>
    </main>
  )
}

function SeatMap({
  selectedSeat,
  onSelect,
}: {
  shiftId: string
  selectedSeat: string
  onSelect: (seat: string) => void
  readonly?: boolean
}) {
  return (
    <LibraryModelView
      onSelect={() => onSelect(selectedSeat || SEATS[0].seatNo)}
    />
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
}: {
  icon: any
  label: string
  value: string
  detail: string
  tone?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="grid size-9 place-items-center rounded-xl bg-muted text-primary">
          <Icon className="size-4" />
        </div>

        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
            tone === 'warn'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {detail}
        </span>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function AppShell({
  role,
  onLogout,
  children,
}: {
  role: Role
  onLogout: () => void
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-card px-5 py-6 lg:flex">
        <Logo />

        <nav className="mt-12 flex flex-col gap-2">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">
            Workspace
          </p>

          <a className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-3 text-sm font-semibold text-primary">
            <LayoutDashboard className="size-4" />
            Overview
          </a>

          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
            <Users className="size-4" />
            Students
          </a>

          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
            <FileText className="size-4" />
            Payments & dues
          </a>

          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
            <Settings className="size-4" />
            Settings
          </a>
        </nav>

        <div className="mt-auto rounded-2xl bg-muted p-4">
          <p className="text-xs font-semibold">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Contact the support desk for account help.
          </p>

          <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
            Open help
            <ExternalLink className="size-3" />
          </button>
        </div>

        <button
          onClick={onLogout}
          className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <Menu className="size-5" />
            <Logo />
          </div>

          <div className="hidden lg:block">
            <p className="font-serif text-xl font-bold">Good morning, Admin</p>
            <p className="mt-1 text-xs text-muted-foreground">
              KL Book House
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Search"
              className="hidden size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted sm:grid"
            >
              <Search className="size-4" />
            </button>

            <button
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </button>

            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              AD
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

function AssignmentPanel({
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
  const [admissionDate, setAdmissionDate] = useState(
    existing?.admissionDate ?? '',
  )
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ?? '')
  const [mobileNo, setMobileNo] = useState(existing?.mobileNo ?? '')
  const [amountDue, setAmountDue] = useState(
    existing?.amountDue?.toString() ?? '0',
  )
  const [amountPaid, setAmountPaid] = useState(
    existing?.amountPaid?.toString() ?? '0',
  )
  const [dueStatus, setDueStatus] = useState<
    'paid' | 'partial' | 'due'
  >(existing?.dueStatus ?? 'paid')
  const [selectedShifts, setSelectedShifts] = useState<string[]>(
    existing?.shiftIds ?? [shiftId],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  // Animation: slide-in on mount
  useEffect(() => {
    setVisible(true)
  }, [])

  // Handle exit animation, then notify parent to unmount
  const handleClose = async () => {
    setClosing(true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    onClose()
  }

  const handleSave = async () => {
    // Validate required fields
    if (!studentName.trim() || !billNo.trim()) {
      setError('Student name and bill number are required.')
      return
    }

    // Validate mobile number: exactly 10 digits
    const cleanMobile = mobileNo.replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits')
      return
    }

    // Validate at least one shift is selected
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

    // Prepare assignment data based on payment status
    let finalAmountDue = Number(amountDue) || 0
    let finalAmountPaid = Number(amountPaid) || 0

    if (dueStatus === 'paid') {
      finalAmountDue = 0
    } else if (dueStatus === 'due') {
      finalAmountPaid = 0
    }
    // For 'partial', both amounts are used as entered

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

  // Mobile number input handler: digits only, max 10
  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = event.target.value.replace(/\D/g, '')
    setMobileNo(cleanValue.slice(0, 10))
  }

  const handleAmountDueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = event.target.value.replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    if (parts.length > 2) {
      setAmountDue(parts[0] + '.' + parts[1])
    } else {
      setAmountDue(cleanValue)
    }
  }

  const handleAmountPaidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = event.target.value.replace(/[^0-9.]/g, '')
    const parts = cleanValue.split('.')
    if (parts.length > 2) {
      setAmountPaid(parts[0] + '.' + parts[1])
    } else {
      setAmountPaid(cleanValue)
    }
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
              existing
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground',
            )}
          >
            {existing ? (
              <Check className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
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
              onChange={(event) =>
                setDueStatus(event.target.value as 'paid' | 'partial' | 'due')
              }
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
            {saving
              ? 'Saving...'
              : existing
                ? 'Update assignment'
                : 'Save assignment'}
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

function Dashboard({
  role,
  onLogout,
  student,
}: {
  role: Role
  onLogout: () => void
  student?: Assignment
}) {
  const [shiftId, setShiftId] = useState(student?.shiftIds?.[0] ?? 'morning')
  const [selectedSeat, setSelectedSeat] = useState(student?.seatNo ?? 'A-01')
  const [panelOpen, setPanelOpen] = useState(false)
  const [closingPanel, setClosingPanel] = useState(false)
  const [saved, setSaved] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [searchError, setSearchError] = useState('')

  const isStudent = role === 'student'

  const selectSeat = (raw: string) => {
    const seatNo = raw.trim().toUpperCase()
    setSearchError('')

    if (!seatNo) {
      setSearchError('Please enter a seat number')
      return false
    }
    const seatExists = SEATS.some((seat) => seat.seatNo === seatNo)
    if (!seatExists) {
      setSearchError(`Seat ${seatNo} does not exist`)
      return false
    }
    setSelectedSeat(seatNo)
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

      if (isStudent && student?.billNo && student.mobileNo) {
        const studentQuery = query(
          collection(db, 'assignments'),
          where('billNo', '==', student.billNo),
          where('mobileNo', '==', student.mobileNo),
        )

        const snapshot = await getDocs(studentQuery)

        const data = snapshot.docs.map((assignmentDoc) => {
          const docData = assignmentDoc.data()
          return {
            id: assignmentDoc.id,
            seatNo: docData.seatNo || '',
            studentName: docData.studentName || '',
            billNo: docData.billNo || '',
            shiftIds: docData.shiftIds || [],
            admissionDate: docData.admissionDate || '',
            expiryDate: docData.expiryDate || '',
            mobileNo: docData.mobileNo || '',
            dueStatus: docData.dueStatus || 'paid',
            amountPaid: docData.amountPaid ?? 0,
            amountDue: docData.amountDue ?? 0,
          }
        }) as Assignment[]

        setAssignments(data)
      } else {
        const snapshot = await getDocs(collection(db, 'assignments'))

        const data = snapshot.docs.map((assignmentDoc) => {
          const docData = assignmentDoc.data()
          return {
            id: assignmentDoc.id,
            seatNo: docData.seatNo || '',
            studentName: docData.studentName || '',
            billNo: docData.billNo || '',
            shiftIds: docData.shiftIds || [],
            admissionDate: docData.admissionDate || '',
            expiryDate: docData.expiryDate || '',
            mobileNo: docData.mobileNo || '',
            dueStatus: docData.dueStatus || 'paid',
            amountPaid: docData.amountPaid ?? 0,
            amountDue: docData.amountDue ?? 0,
          }
        }) as Assignment[]

        setAssignments(data)
      }
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
      if (auth && !isStudent) {
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

  const closePanel = () => {
    setClosingPanel(true)
    setTimeout(() => {
      setPanelOpen(false)
      setClosingPanel(false)
    }, 0)
  }

  return (
    <AppShell role={role} onLogout={() => void handleLogout()}>
      <main className="mx-auto max-w-[1500px] p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>{isStudent ? 'Student' : 'Workspace'}</span>
              <ChevronDown className="size-3" />
              <span className="text-primary">Overview</span>
            </div>

            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
              {isStudent ? 'Your library overview' : 'Library overview'}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {isStudent
                ? 'View your membership, seat and payment information.'
                : 'Manage your real library data, seats, shifts, and payments.'}
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

        {!isStudent && (
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
                  placeholder="Search by seat number (e.g., A-05)"
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
        )}

        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {loadError}
          </div>
        )}

        {!isStudent ? (
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
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={LayoutDashboard}
              label="Your seat"
              value={student?.seatNo ?? '—'}
              detail={student?.shiftIds?.join(', ') ?? '—'}
            />

            <Stat
              icon={Clock3}
              label="Valid until"
              value={student?.expiryDate ?? '—'}
              detail={student ? getExpiryLabel(student.expiryDate) : '—'}
            />

            <Stat
              icon={CreditCard}
              label="Payment status"
              value={student?.dueStatus === 'paid' ? 'Paid' : 'Due'}
              detail={
                student?.amountDue
                  ? `₹${student.amountDue.toLocaleString('en-IN')}`
                  : 'No dues'
              }
              tone={student?.dueStatus === 'paid' ? 'default' : 'warn'}
            />

            <Stat
              icon={Users}
              label="Student"
              value={student?.studentName ?? '—'}
              detail={student?.billNo ?? '—'}
            />
          </div>
        )}

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
                  {isStudent
                    ? 'View your assigned seat.'
                    : 'Select a seat to add, edit or remove an assignment.'}
                </p>
              </div>

              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {SHIFTS.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => {
                      setShiftId(shift.id)
                      if (!isStudent) {
                        setSelectedSeat('A-01')
                      } else if (student?.shiftIds?.includes(shift.id)) {
                        setSelectedSeat(student.seatNo)
                      }
                    }}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs font-semibold transition',
                      shiftId === shift.id
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
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
                readonly={isStudent}
              />
            </div>

            {!isStudent && (
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
            )}
          </section>

          <aside className="flex flex-col gap-6">
            {isStudent ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Your membership
                </p>

                <h2 className="mt-2 font-serif text-2xl font-bold">
                  {student?.studentName ?? 'Student'}
                </h2>

                <div className="mt-6 flex flex-col gap-4 text-sm">
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">
                      Bill number
                    </span>
                    <strong>{student?.billNo ?? '—'}</strong>
                  </div>

                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Seat</span>
                    <strong>{student?.seatNo ?? '—'}</strong>
                  </div>

                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Shift</span>
                    <strong>
                      {student?.shiftIds
                        ?.map((id) => SHIFTS.find((s) => s.id === id)?.name ?? id)
                        .join(', ') ?? '—'}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Valid until
                    </span>
                    <strong>{student?.expiryDate ?? '—'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </aside>
        </div>

        {!isStudent && (
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
                  setSelectedSeat('A-01')
                  setShiftId('morning')
                  setPanelOpen(true)
                }}
                className="mt-6 flex items-center gap-2 rounded-xl bg-card px-4 py-3 text-xs font-bold text-primary"
              >
                Assign a seat
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

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
          onClose={closePanel}
          onSaved={handleSaved}
        />
      )}

      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-xl">
          <Check className="size-4 text-primary" />
          Assignment saved to Firestore

          <button
            onClick={() => setSaved(false)}
            aria-label="Close message"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </AppShell>
  )
}

export default function Page() {
  const [view, setView] = useState<ViewMode>('login')

  if (view === 'login') {
    return <Login onLogin={setView} />
  }

  return (
    <Dashboard
      role={view}
      onLogout={() => setView('login')}
    />
  )
}