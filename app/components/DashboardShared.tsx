'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import {
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
import type { AdminProfile } from '@/lib/admin-profile'
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
      <div className="grid size-10 shrink-0 place-items-center">
        <img
          src="/images/library/kl-boox-house-logo.png"
          alt="KL Boox House logo"
          className="size-10 object-contain"
        />
      </div>
      <div>
        <p className="font-serif text-lg font-bold leading-none tracking-tight">
          KL Boox House
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Library management
        </p>
      </div>
    </div>
  )
}

export function CommonHeader({
  left,
  center,
  right,
  className,
}: {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'border-b border-border/70 bg-[var(--background)]/90 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-10',
        className,
      )}
      role="banner"
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div className="min-w-0 flex-1">{left ?? <Logo />}</div>
        {center && <div className="hidden min-w-0 flex-1 justify-center text-center lg:flex">{center}</div>}
        <div className="flex shrink-0 items-center justify-end gap-3">{right}</div>
      </div>
    </header>
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
    <div className="stat-card card-surface rounded-2xl border border-border bg-card p-5">
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
            className="grid size-9 place-items-center rounded-lg text-muted-foreground icon-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
  adminProfile,
  onProfile,
  onSettings,
  onLogout,
  open,
  onOpenChange,
}: {
  role: Role
  greetingName: string
  adminProfile?: AdminProfile
  onProfile?: () => void
  onSettings?: () => void
  onLogout: () => void
  open?: boolean
  onOpenChange?: (value: boolean) => void
}) {
  const isControlled = open !== undefined && onOpenChange !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)

  const isOpen = isControlled ? open : internalOpen

  const closeMenu = useCallback(() => {
    if (isControlled) {
      onOpenChange(false)
    } else {
      setInternalOpen(false)
    }
  }, [isControlled, onOpenChange])

  const toggleMenu = useCallback(() => {
    if (isControlled) {
      onOpenChange(!open)
    } else {
      setInternalOpen((prev) => !prev)
    }
  }, [isControlled, onOpenChange, open])

  // Focus management: move into menu on open, restore to trigger on close
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => firstItemRef.current?.focus())
    }
  }, [isOpen])

  const menuContent = (
    <>
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
        {adminProfile?.photoURL ? (
          <img
            src={adminProfile.photoURL}
            alt={greetingName}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {greetingName.slice(0, 2).toUpperCase()}
          </div>
        )}
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
          className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground menu-item"
        >
          <User className="size-4 text-muted-foreground" aria-hidden="true" />
          Profile
        </button>
      )}

      {onSettings && (
        <button
          role="menuitem"
          onClick={() => { closeMenu(); onSettings() }}
          className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground menu-item"
        >
          <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
          Settings
        </button>
      )}

      <div className="my-1 h-px bg-border" />

      <button
        role="menuitem"
        onClick={() => { closeMenu(); onLogout() }}
        className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground menu-item-danger"
      >
        <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
        Sign out
      </button>
    </>
  )

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-xl px-1.5 transition duration-150',
          'hover:bg-muted',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'avatar-hover',
        )}
      >
        {adminProfile?.photoURL ? (
          <img
            src={adminProfile.photoURL}
            alt={greetingName}
            className="size-10 rounded-xl object-cover"
          />
        ) : (
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {greetingName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-150',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Mobile inline menu - rendered by AppShell outside header */}

      {/* Desktop dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Profile options"
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lg shadow-primary/5 menu-panel',
            'menu-enter hidden lg:block',
          )}
        >
          {menuContent}
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
  adminProfile,
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
  adminProfile?: AdminProfile
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

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

  // Close mobile admin menu on outside click or Escape
  useEffect(() => {
    if (!adminMenuOpen) return

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const menuEl = mobileMenuRef.current
      const triggerEl = document.querySelector('[aria-haspopup="menu"][aria-expanded="true"]')
      if (menuEl && !menuEl.contains(target) && (!triggerEl || !triggerEl.contains(target))) {
        setAdminMenuOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAdminMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [adminMenuOpen])

  const navLinkClasses = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-left sidebar-link',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      active
        ? 'bg-primary/10 font-semibold text-primary'
        : 'text-muted-foreground',
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
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground sidebar-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
        <CommonHeader
          className="header-bar h-16 sm:h-20"
          left={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground icon-button lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Menu className="size-5" />
              </button>
              <div className="lg:hidden">
                <Logo />
              </div>
            </div>
          }
          center={
            <div className="hidden lg:block">
              <p className="font-serif text-xl font-bold">
                Good morning, {greetingName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                KL Boox House
              </p>
            </div>
          }
          right={
            <div className="flex items-center gap-2 sm:gap-3">
              <ProfileMenu
                role={role}
                greetingName={greetingName}
                adminProfile={adminProfile}
                onProfile={onNavigateSettings}
                onSettings={onNavigateSettings}
                onLogout={onLogout}
                open={adminMenuOpen}
                onOpenChange={setAdminMenuOpen}
              />
            </div>
          }
        />

        {/* Mobile admin inline menu — pushes main content down */}
        <div
          ref={mobileMenuRef}
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-200 ease-out',
            adminMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="mx-4 sm:mx-6">
            <div
              role="menu"
              aria-label="Profile options"
              className="menu-panel rounded-xl border border-border bg-card p-1.5 shadow-sm"
            >
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                {adminProfile?.photoURL ? (
                  <img
                    src={adminProfile.photoURL}
                    alt={greetingName}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {greetingName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{greetingName}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>

              <div className="my-1 h-px bg-border" />

              {onNavigateSettings && (
                <button
                  role="menuitem"
                  onClick={() => { setAdminMenuOpen(false); onNavigateSettings() }}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground menu-item"
                >
                  <User className="size-4 text-muted-foreground" aria-hidden="true" />
                  Profile
                </button>
              )}

              {onNavigateSettings && (
                <button
                  role="menuitem"
                  onClick={() => { setAdminMenuOpen(false); onNavigateSettings() }}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground menu-item"
                >
                  <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
                  Settings
                </button>
              )}

              <div className="my-1 h-px bg-border" />

              <button
                role="menuitem"
                onClick={() => { setAdminMenuOpen(false); onLogout() }}
                className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-foreground menu-item-danger"
              >
                <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        <main id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export { Clock3 }