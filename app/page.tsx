'use client'

import { lazy, Suspense, useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import type { Assignment, Role } from '@/lib/library-data'
import { auth } from '@/lib/firebase'
import { clearClientCache } from '@/lib/client-data'
import { getAdminProfile, type AdminProfile } from '@/lib/admin-profile'
import { Login } from './components/Login'
import { LandingPage } from './components/LandingPage'
import { AppShell } from './components/DashboardShared'

const AdminDashboard = lazy(() => import('./components/admindashboard').then(m => ({ default: m.AdminDashboard })))
const StudentDashboard = lazy(() => import('./components/studentdashboard').then(m => ({ default: m.StudentDashboard })))
const StudentsPage = lazy(() => import('./components/student_data'))
const PaymentsDuePage = lazy(() => import('./components/PaymentsDuePage'))
const LiveAttendancePage = lazy(() => import('./components/LiveAttendancePage'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))

type View = 'landing' | 'login' | 'admin' | 'student' | 'students' | 'payments' | 'attendance' | 'settings'

function ContentFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading view">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function Page() {
  const [view, setView] = useState<View>('landing')
  const [loginRole, setLoginRole] = useState<Role>('admin')
  const [studentAssignment, setStudentAssignment] = useState<Assignment | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth)
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      clearClientCache()
      setView('landing')
      setStudentAssignment(null)
      setAdminProfile(null)
    }
  }

  useEffect(() => {
    if (view !== 'admin') return
    let cancelled = false
    getAdminProfile().then((profile) => {
      if (!cancelled && profile) setAdminProfile(profile)
    })
    return () => { cancelled = true }
  }, [view])

  const updateAdminProfile = (patch: Partial<AdminProfile>) => {
    setAdminProfile((prev) => {
      const next = { ...(prev ?? {}), ...patch } as AdminProfile
      return next
    })
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onSelectRole={(role) => {
          setLoginRole(role)
          setView('login')
        }}
      />
    )
  }

  if (view === 'login') {
    return (
      <Login
        initialRole={loginRole}
        onLogin={(role, assignment) => {
          if (role === 'admin') {
            setView('admin')
          } else if (assignment) {
            setStudentAssignment(assignment)
            setView('student')
          }
        }}
      />
    )
  }

  const isStudent = studentAssignment !== null
  const role = isStudent ? 'student' : 'admin'
  const greetingName = isStudent ? (studentAssignment?.studentName || 'Student') : (adminProfile?.displayName || 'Admin')
  const activeView =
    view === 'admin' || view === 'student'
      ? 'overview'
      : (view as 'overview' | 'attendance' | 'students' | 'payments' | 'settings')

  const goOverview = () => setView(isStudent ? 'student' : 'admin')
  const goAttendance = () => setView('attendance')
  const goStudents = () => setView('students')
  const goPayments = () => setView('payments')
  const goSettings = () => setView('settings')

  return (
    <AppShell
      role={role}
      greetingName={greetingName}
      activeView={activeView}
      onNavigateOverview={goOverview}
      onNavigateAttendance={goAttendance}
      onNavigateStudents={goStudents}
      onNavigatePayments={goPayments}
      onNavigateSettings={goSettings}
      onLogout={() => void handleLogout()}
      adminProfile={adminProfile ?? undefined}
    >
      <div key={view} className="page-enter">
        <Suspense fallback={<ContentFallback />}>
          {view === 'admin' && <AdminDashboard />}
          {view === 'students' && role === 'admin' && <StudentsPage role={role} />}
          {view === 'payments' && role === 'admin' && <PaymentsDuePage role={role} />}
          {view === 'attendance' && role === 'admin' && <LiveAttendancePage role={role} />}
          {view === 'settings' && <SettingsPage role={role} student={studentAssignment ?? undefined} onLogout={() => void handleLogout()} adminProfile={adminProfile ?? undefined} onProfileUpdate={updateAdminProfile} />}
          {view === 'student' && studentAssignment && (
            <StudentDashboard
              student={studentAssignment}
              onIdentityChange={setStudentAssignment}
            />
          )}
        </Suspense>
      </div>
    </AppShell>
  )
}