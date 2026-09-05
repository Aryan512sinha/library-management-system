'use client'

import { lazy, Suspense, useState } from 'react'
import { signOut } from 'firebase/auth'
import type { Assignment } from '@/lib/library-data'
import { auth } from '@/lib/firebase'
import { clearClientCache } from '@/lib/client-data'
import { Login } from './components/Login'
import { AppShell } from './components/DashboardShared'

const AdminDashboard = lazy(() => import('./components/admindashboard').then(m => ({ default: m.AdminDashboard })))
const StudentDashboard = lazy(() => import('./components/studentdashboard').then(m => ({ default: m.StudentDashboard })))
const StudentsPage = lazy(() => import('./components/student_data'))
const PaymentsDuePage = lazy(() => import('./components/PaymentsDuePage'))
const LiveAttendancePage = lazy(() => import('./components/LiveAttendancePage'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))

type View = 'login' | 'admin' | 'student' | 'students' | 'payments' | 'attendance' | 'settings'

// Lightweight fallback shown only while a lazily-imported chunk loads for the
// first time. Kept inside the content area so the shell never flashes.
function ContentFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading view">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function Page() {
  const [view, setView] = useState<View>('login')
  const [studentAssignment, setStudentAssignment] = useState<Assignment | null>(null)

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth)
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      clearClientCache()
      setView('login')
      setStudentAssignment(null)
    }
  }

  if (view === 'login') {
    return (
      <Login
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
  const greetingName = isStudent ? (studentAssignment?.studentName || 'Student') : 'Admin'
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
    >
      <div key={view} className="page-enter">
        <Suspense fallback={<ContentFallback />}>
          {view === 'admin' && <AdminDashboard />}
          {view === 'students' && <StudentsPage />}
          {view === 'payments' && <PaymentsDuePage />}
          {view === 'attendance' && <LiveAttendancePage />}
          {view === 'settings' && <SettingsPage role={role} student={studentAssignment ?? undefined} onLogout={() => void handleLogout()} />}
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