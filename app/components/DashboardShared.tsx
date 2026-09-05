'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import {
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  X,
  FileText,
} from 'lucide-react'
import type { Assignment, Role } from '@/lib/library-data'
import { LibraryModelView } from '@/components/library-model'
import { cn } from '@/lib/utils'
import { mapAssignmentDoc } from '@/lib/client-data'
import { useFocusTrap } from '@/hooks/useFocusTrap'

// ---------------------------------------------------------------------------
// Re-export cn for any files that still import from here
// ---------------------------------------------------------------------------

export { cn }

export { mapAssignmentDoc }

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <BookOpen className="size-5" aria-hidden="true" />
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

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

export function Stat({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
  tone?: string
}) {
  return (
    <div className="card-surface rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="grid size-9 place-items-center rounded-xl bg-muted text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>

        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
            tone === 'warn'
              ? 'bg-warning-subtle text-warning-foreground'
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

// ---------------------------------------------------------------------------
// Seat map wrapper
// ---------------------------------------------------------------------------

export function SeatMap({
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
      onSelect={(seat) => onSelect(seat)}
    />
  )
}

// ---------------------------------------------------------------------------
// Mobile drawer
// ---------------------------------------------------------------------------

function MobileDrawer({
  open,
  onClose,
  navContent,
  sidebarContent,
}: {
  open: boolean
  onClose: () => void
  navContent: React.ReactNode
  sidebarContent: React.ReactNode
}) {
  const trapRef = useFocusTrap(open)

  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-border bg-card p-5 drawer-enter"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="mt-8 flex flex-col gap-2">
          {navContent}
        </nav>

        <div className="mt-auto">
          {sidebarContent}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile menu (avatar dropdown)
// ---------------------------------------------------------------------------

function ProfileMenu({
  role,
  greetingName,
  onProfile,
  onSettings,
  onLogout,
}: {
  role: Role
  greetingName: string
  onProfile?: () => void
  onSettings?: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 100)
  }, [])

  // Focus management: move into menu on open, restore to trigger on close
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => firstItemRef.current?.focus())
    } else {
      setClosing(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
        triggerRef.current?.focus()
      }
    }
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !menuRef.current) return
      const items = menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const focusable = menuRef.current.contains(document.activeElement)
      if (!focusable && !e.shiftKey) {
        e.preventDefault()
        first.focus()
        return
      }
      if (e.shiftKey && focusable && document.activeElement === first) {
        e.preventDefault()
        last.focus()
        return
      }
      if (!e.shiftKey && focusable && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [open, closeMenu])

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={() => (open ? closeMenu() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-xl px-1.5 transition duration-150',
          'hover:bg-muted',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        )}
      >
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {greetingName.slice(0, 2).toUpperCase()}
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile options"
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lg shadow-primary/5',
            closing ? 'modal-exit' : 'menu-enter',
          )}
        >
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {greetingName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{greetingName}</p>
              <p className="text-xs text-muted-foreground">
                {role === 'admin' ? 'Administrator' : 'Member'}
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          {onProfile && (
            <button
              ref={firstItemRef}
              role="menuitem"
              onClick={() => { closeMenu(); onProfile() }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition duration-150 hover:bg-muted"
            >
              <User className="size-4 text-muted-foreground" aria-hidden="true" />
              Profile
            </button>
          )}

          {onSettings && (
            <button
              role="menuitem"
              onClick={() => { closeMenu(); onSettings() }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition duration-150 hover:bg-muted"
            >
              <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
              Settings
            </button>
          )}

          <div className="my-1 h-px bg-border" />

          <button
            role="menuitem"
            onClick={() => { closeMenu(); onLogout() }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition duration-150 hover:bg-muted hover:text-destructive"
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App shell (sidebar + topbar) shared by both dashboards
// ---------------------------------------------------------------------------

export function AppShell({
  role,
  greetingName,
  activeView = 'overview',
  onNavigateOverview,
  onNavigateAttendance,
  onNavigateStudents,
  onNavigatePayments,
  onNavigateSettings,
  onLogout,
  children,
}: {
  role: Role
  greetingName: string
  activeView?: 'overview' | 'attendance' | 'students' | 'payments' | 'settings'
  onNavigateOverview?: () => void
  onNavigateAttendance?: () => void
  onNavigateStudents?: () => void
  onNavigatePayments?: () => void
  onNavigateSettings?: () => void
  onLogout: () => void
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [drawerOpen])

  const navLinkClasses = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition text-left',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      active
        ? 'bg-primary/10 font-semibold text-primary'
        : 'text-muted-foreground hover:bg-muted',
    )

  const navItems = (
    <>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">
        Workspace
      </p>

      <button
        type="button"
        onClick={() => { onNavigateOverview?.(); closeDrawer() }}
        className={navLinkClasses(activeView === 'overview')}
        aria-current={activeView === 'overview' ? 'page' : undefined}
      >
        <LayoutDashboard className="size-4" aria-hidden="true" />
        Overview
      </button>

      {role === 'admin' && (
        <>
          <button
            type="button"
            onClick={() => { onNavigateAttendance?.(); closeDrawer() }}
            className={navLinkClasses(activeView === 'attendance')}
            aria-current={activeView === 'attendance' ? 'page' : undefined}
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Live Attendance
          </button>

          <button
            type="button"
            onClick={() => { onNavigateStudents?.(); closeDrawer() }}
            className={navLinkClasses(activeView === 'students')}
            aria-current={activeView === 'students' ? 'page' : undefined}
          >
            <Users className="size-4" aria-hidden="true" />
            Students
          </button>

          <button
            type="button"
            onClick={() => { onNavigatePayments?.(); closeDrawer() }}
            className={navLinkClasses(activeView === 'payments')}
            aria-current={activeView === 'payments' ? 'page' : undefined}
          >
            <FileText className="size-4" aria-hidden="true" />
            Payments & dues
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => { onNavigateSettings?.(); closeDrawer() }}
        className={cn(navLinkClasses(activeView === 'settings'), 'mt-2')}
        aria-current={activeView === 'settings' ? 'page' : undefined}
      >
        <Settings className="size-4" aria-hidden="true" />
        Settings
      </button>
    </>
  )

  const sidebarBottom = (
    <>
      <button
        onClick={() => { onLogout(); closeDrawer() }}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-card px-5 py-6 lg:flex"
        aria-label="Sidebar"
      >
        <Logo />

        <nav aria-label="Main navigation" className="mt-12 flex flex-col gap-2">
          {navItems}
        </nav>

        <div className="mt-auto">
          {sidebarBottom}
        </div>
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        navContent={navItems}
        sidebarContent={sidebarBottom}
      />

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:h-20 sm:px-6 lg:px-10" role="banner">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
          </div>

          <div className="hidden lg:block">
            <p className="font-serif text-xl font-bold">
              Good morning, {greetingName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              KL Book House
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ProfileMenu
              role={role}
              greetingName={greetingName}
              onProfile={onNavigateSettings}
              onSettings={onNavigateSettings}
              onLogout={onLogout}
            />
          </div>
        </header>

        <main id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export { Clock3 }
