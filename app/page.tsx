'use client'

import { useState } from 'react'
import type { Assignment } from '@/lib/library-data'
import { Login } from './components/Login'
import { AdminDashboard } from './components/admindashboard'
import { StudentDashboard } from './components/studentdashboard'
import StudentsPage from './components/student_data'
import PaymentsDuePage from './components/PaymentsDuePage'

type View = 'login' | 'admin' | 'student' | 'students' | 'payments'

export default function Page() {
  const [view, setView] = useState<View>('login')
  const [studentAssignment, setStudentAssignment] = useState<Assignment | null>(null)

  const handleLogout = () => {
    setView('login')
    setStudentAssignment(null)
  }

  if (view === 'admin') {
    return (
      <AdminDashboard
        onLogout={handleLogout}
        onShowStudents={() => setView('students')}
        onShowPayments={() => setView('payments')}
      />
    )
  }

  if (view === 'students') {
    return (
      <StudentsPage
        onBack={() => setView('admin')}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'payments') {
    return (
      <PaymentsDuePage
        onLogout={handleLogout}
        onNavigateOverview={() => setView('admin')}
        onNavigateStudents={() => setView('students')}
      />
    )
  }

  if (view === 'student' && studentAssignment) {
    return <StudentDashboard student={studentAssignment} onLogout={handleLogout} />
  }

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