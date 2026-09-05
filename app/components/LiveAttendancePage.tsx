'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  X,
} from 'lucide-react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import {
  SEATS,
  SHIFTS,
  type Assignment,
  type AttendanceRecord,
  type ShiftId,
} from '@/lib/library-data'
import { db } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import {
  getCachedAssignments,
  getCachedAttendance,
  setCachedAttendance,
  getAssignments,
} from '@/lib/client-data'
import { Stat } from './DashboardShared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function shiftDateDocId(date: string, shiftId: string, seatNo: string): string {
  return `${date}_${shiftId}_${seatNo}`
}

// ---------------------------------------------------------------------------
// Individual seat cell — memoized to prevent 57-seat re-renders
// ---------------------------------------------------------------------------

const SeatCell = memo(function SeatCell({
  seatNo,
  number,
  present,
  studentName,
  isEmpty,
  isToggling,
  onToggle,
}: {
  seatNo: string
  number: number
  present: boolean
  studentName: string | undefined
  isEmpty: boolean
  isToggling: boolean
  onToggle: (seatNo: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(seatNo)}
      disabled={isToggling}
      aria-label={`Seat ${number}, ${present ? 'present' : 'not marked'}${studentName ? `, ${studentName}` : ''}`}
      aria-pressed={present}
      className={cn(
        'group relative aspect-square rounded-xl border p-1.5 sm:p-2 transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-offset-background',
        present
          ? 'border-success/30 bg-success/10 hover:bg-success/20'
          : 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10',
        isToggling && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Status icon */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full transition-all duration-150',
            present
              ? 'bg-success text-success-foreground'
              : 'bg-destructive/80 text-white',
          )}
          aria-hidden="true"
        >
          {present ? (
            <Check className="size-3" strokeWidth={3} />
          ) : (
            <X className="size-3" strokeWidth={3} />
          )}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          {String(number).padStart(2, '0')}
        </span>
      </div>

      {/* Student name or empty */}
      <div className="mt-auto flex h-full items-center justify-center">
        <p
          className={cn(
            'text-center text-[10px] leading-tight font-medium line-clamp-2',
            present ? 'text-success' : 'text-destructive/60',
          )}
        >
          {studentName
            ? studentName.split(' ')[0]
            : isEmpty
              ? 'Available'
              : ''}
        </p>
      </div>

      {/* Status label */}
      <p
        className={cn(
          'text-center text-[8px] font-bold uppercase tracking-wider',
          present ? 'text-success' : 'text-destructive/60',
        )}
      >
        {present ? 'Present' : 'Not marked'}
      </p>
    </button>
  )
})

// ---------------------------------------------------------------------------
// LiveAttendancePage
// ---------------------------------------------------------------------------

export default function LiveAttendancePage() {
  const [activeShift, setActiveShift] = useState<ShiftId>(SHIFTS[0].id)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(() =>
    getCachedAttendance(`${todayStr()}:${SHIFTS[0].id}`) ?? {},
  )
  const [assignments, setAssignments] = useState<Assignment[]>(() => getCachedAssignments() ?? [])
  const [loadingAttendance, setLoadingAttendance] = useState(
    () => getCachedAttendance(`${todayStr()}:${SHIFTS[0].id}`) === null,
  )
  const [showFullSkeleton, setShowFullSkeleton] = useState(
    () => getCachedAttendance(`${todayStr()}:${SHIFTS[0].id}`) === null && getCachedAssignments() === null,
  )
  const [loadError, setLoadError] = useState('')
  const [togglingSeat, setTogglingSeat] = useState<string | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  const loadAssignments = useCallback(async () => {
    if (!db) return
    try {
      const list = await getAssignments()
      if (list) setAssignments(list)
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setLoadError('Could not load student data.')
    }
  }, [])

  // When the shift/date changes: keep prior grid visible and show a localized
  // loading strip instead of replacing the whole board with a skeleton.
  useEffect(() => {
    if (!db) return

    const cacheKey = `${selectedDate}:${activeShift}`
    const cached = getCachedAttendance(cacheKey)

    if (!cached && !loadingAttendance) {
      setLoadingAttendance(true)
    }
    setLoadError('')

    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    const q = query(
      collection(db, 'attendance'),
      where('date', '==', selectedDate),
      where('shiftId', '==', activeShift),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const map: Record<string, boolean> = {}
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AttendanceRecord
          map[data.seatNo] = data.present
        })
        setAttendanceMap(map)
        setCachedAttendance(cacheKey, map)
        setLoadingAttendance(false)
        setShowFullSkeleton(false)
      },
      (error) => {
        console.error('Attendance listener error:', error)
        setLoadError('Failed to load attendance. Check Firestore rules and indexes.')
        setLoadingAttendance(false)
        setShowFullSkeleton(false)
      },
    )

    unsubRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeShift])

  useEffect(() => {
    void loadAssignments()
  }, [loadAssignments])

  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
      }
    }
  }, [])

  const toggleAttendance = useCallback(
    async (seatNo: string) => {
      if (!db || togglingSeat) return

      const currentlyPresent = attendanceMap[seatNo] ?? false
      const docId = shiftDateDocId(selectedDate, activeShift, seatNo)
      const docRef = doc(db, 'attendance', docId)

      const nextMap = { ...attendanceMap, [seatNo]: !currentlyPresent }
      const cacheKey = `${selectedDate}:${activeShift}`
      setAttendanceMap(nextMap)
      setCachedAttendance(cacheKey, nextMap)
      setTogglingSeat(seatNo)

      try {
        if (currentlyPresent) {
          await deleteDoc(docRef)
        } else {
          const record: AttendanceRecord = {
            date: selectedDate,
            shiftId: activeShift,
            seatNo,
            present: true,
            markedAt: Date.now(),
          }
          await setDoc(docRef, record)
        }
      } catch (error) {
        console.error('Failed to toggle attendance:', error)
        const rolledBack = { ...attendanceMap, [seatNo]: currentlyPresent }
        setAttendanceMap(rolledBack)
        setCachedAttendance(`${selectedDate}:${activeShift}`, rolledBack)
        setLoadError('Failed to save attendance. Please try again.')
      } finally {
        setTogglingSeat(null)
      }
    },
    [attendanceMap, selectedDate, activeShift, togglingSeat],
  )

  const assignmentBySeat = useMemo(() => {
    const map: Record<string, Assignment> = {}
    for (const a of assignments) {
      map[a.seatNo] = a
    }
    return map
  }, [assignments])

  const stats = useMemo(() => {
    const total = SEATS.length
    let present = 0
    for (const seat of SEATS) {
      if (attendanceMap[seat.seatNo]) present++
    }
    const notMarked = total - present
    const pct = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, notMarked, pct }
  }, [attendanceMap])

  const shiftDate = (offset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + offset)
    const ny = date.getFullYear()
    const nm = String(date.getMonth() + 1).padStart(2, '0')
    const nd = String(date.getDate()).padStart(2, '0')
    return `${ny}-${nm}-${nd}`
  }

  const isToday = selectedDate === todayStr()

  return (
    <>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Live attendance
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mark and monitor attendance for each seat and shift.
            </p>
          </div>

          {/* Date selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(shiftDate(-1))}
              className={cn(
                'grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition duration-150 hover:bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
              aria-label="Previous day"
            >
              <span className="text-lg leading-none">&lsaquo;</span>
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:px-4" aria-live="polite">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              <div className="text-sm font-semibold">
                {formatDateDisplay(selectedDate)}
              </div>
            </div>

            <button
              onClick={() => setSelectedDate(shiftDate(1))}
              className={cn(
                'grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition duration-150 hover:bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
              aria-label="Next day"
            >
              <span className="text-lg leading-none">&rsaquo;</span>
            </button>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr())}
                className={cn(
                  'rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition duration-150 hover:bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {loadError && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{loadError}</span>
            <button
              onClick={() => setLoadError('')}
              className={cn(
                'grid size-6 place-items-center rounded-lg text-destructive transition duration-150 hover:bg-destructive/10',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
              aria-label="Dismiss error"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Shift tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1" role="tablist" aria-label="Shift selector">
          {SHIFTS.map((shift) => (
            <button
              key={shift.id}
              type="button"
              role="tab"
              aria-selected={activeShift === shift.id}
              onClick={() => setActiveShift(shift.id as ShiftId)}
              className={cn(
                'relative flex-1 min-w-[100px] rounded-lg px-3 py-2.5 text-center transition duration-150 sm:min-w-[120px] sm:px-4 sm:py-3',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                activeShift === shift.id
                  ? 'bg-card font-semibold text-foreground shadow-sm tab-active'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">{shift.short}</span>
              <span className="mt-0.5 block text-xs font-semibold sm:text-sm">{shift.name}</span>
              {activeShift === shift.id && (
                <span className="absolute inset-x-4 -bottom-px h-0.5 origin-left scale-x-100 animate-[tabUnderline_220ms_cubic-bezier(0.16,1,0.3,1)] rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" role="list" aria-label="Attendance statistics">
          <div role="listitem">
            <Stat icon={ClipboardCheck} label="Total seats" value={String(stats.total)} detail={SHIFTS.length + ' shifts'} />
          </div>
          <div role="listitem">
            <Stat icon={CheckCircle2} label="Present" value={String(stats.present)} detail={stats.pct + '% attendance'} />
          </div>
          <div role="listitem">
            <Stat icon={CalendarCheck} label="Not marked" value={String(stats.notMarked)} detail={stats.total > 0 ? Math.round((stats.notMarked / stats.total) * 100) + '% pending' : '0% pending'} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-muted text-primary" aria-hidden="true">
                <span className="text-lg font-bold">%</span>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Rate
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight" aria-live="polite">{stats.pct}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Attendance rate</p>
          </div>
        </div>

        {/* Attendance board label */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Attendance board</h2>
          <span className="text-xs text-muted-foreground">
            {SHIFTS.find((s) => s.id === activeShift)?.name} &middot; {formatDateDisplay(selectedDate)}
          </span>
        </div>

        {showFullSkeleton ? (
          <div
            className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-8 sm:gap-2 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14"
            aria-label="Loading attendance"
            role="status"
          >
            {Array.from({ length: 57 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl border border-border bg-muted"
              />
            ))}
          </div>
        ) : loadingAttendance ? (
          <div
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-14 text-sm text-muted-foreground"
            role="status"
            aria-label={`Loading attendance for ${SHIFTS.find((s) => s.id === activeShift)?.name} shift`}
          >
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
            Loading {SHIFTS.find((s) => s.id === activeShift)?.name} attendance...
          </div>
        ) : (
          <div
            key={`${selectedDate}:${activeShift}`}
            className="fade-in mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-8 sm:gap-2 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14"
            role="grid"
            aria-label={`Attendance board for ${SHIFTS.find((s) => s.id === activeShift)?.name} shift on ${formatDateDisplay(selectedDate)}`}
          >
            {SEATS.map((seat) => {
              const present = attendanceMap[seat.seatNo] ?? false
              const assignment = assignmentBySeat[seat.seatNo]

              return (
                <SeatCell
                  key={seat.seatNo}
                  seatNo={seat.seatNo}
                  number={seat.number}
                  present={present}
                  studentName={assignment?.studentName}
                  isEmpty={!assignment}
                  isToggling={togglingSeat === seat.seatNo}
                  onToggle={toggleAttendance}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
