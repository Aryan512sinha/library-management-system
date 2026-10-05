'use client'

import { useEffect, useState } from 'react'
import { AIQuizPage } from '@/app/components/ai-quiz/AIQuizPage'

export default function StudentQuizRoute() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    setAllowed(window.sessionStorage.getItem('library-role') === 'student')
  }, [])

  if (allowed === null) return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking access...</main>
  if (!allowed) return <main className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="font-serif text-2xl font-bold">Student access required</h1><p className="mt-2 text-sm text-muted-foreground">Please sign in as a student to use AI Quiz.</p><a href="/" className="mt-5 inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Back to login</a></div></main>
  return <AIQuizPage onBackToDashboard={() => { window.location.href = '/' }} />
}
