'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { generateQuiz } from '@/lib/quizApi'
import type { AnswerKey, Difficulty, Quiz, QuizAnswers, Question } from '@/lib/quiz-types'
import { cn } from '@/lib/utils'
import { FileUploader } from './FileUploader'

type Stage = 'upload' | 'generating' | 'taking' | 'result' | 'review'
const steps = ['Reading study material', 'Understanding concepts', 'Creating questions', 'Checking question quality', 'Preparing quiz']

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', difficulty === 'easy' ? 'bg-success-subtle text-success' : difficulty === 'medium' ? 'bg-warning-subtle text-warning-foreground' : 'bg-danger-subtle text-destructive')}>{difficulty}</span>
}

function QuestionCard({ question, answer, onAnswer, result }: { question: Question; answer?: AnswerKey; onAnswer?: (answer: AnswerKey) => void; result?: boolean }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-3"><DifficultyBadge difficulty={question.difficulty} /><span className="text-xs text-muted-foreground">Question {question.id} of 20</span></div>
      <h2 className="mt-6 text-lg font-semibold leading-7 sm:text-xl">{question.question}</h2>
      <div className="mt-6 grid gap-3">
        {(Object.keys(question.options) as AnswerKey[]).map((key) => {
          const selected = answer === key
          const correct = result && question.correct_answer === key
          return <button key={key} type="button" disabled={!onAnswer} onClick={() => onAnswer?.(key)} className={cn('flex items-start gap-3 rounded-2xl border p-4 text-left text-sm transition', selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50', correct && 'border-success bg-success-subtle')}><span className="font-bold text-primary">{key}</span><span>{question.options[key]}</span></button>
        })}
      </div>
      {result && (
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <p><span className="font-semibold">Your answer:</span> {answer ? `${answer}. ${question.options[answer]}` : 'Not answered'}</p>
          <p><span className="font-semibold">Correct answer:</span> {question.correct_answer}. {question.options[question.correct_answer]}</p>
          <p className="text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </section>
  )
}

export function AIQuizPage({ onBackToDashboard }: { onBackToDashboard: () => void }) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [current, setCurrent] = useState(0)
  const [progressStep, setProgressStep] = useState(0)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (stage !== 'generating') return
    const timer = window.setInterval(() => setProgressStep((step) => Math.min(step + 1, steps.length - 1)), 500)
    return () => window.clearInterval(timer)
  }, [stage])

  const score = useMemo(() => quiz?.questions.reduce((total, question) => total + (answers[question.id] === question.correct_answer ? 1 : 0), 0) ?? 0, [answers, quiz])
  const counts = useMemo(() => {
    const list = quiz?.questions ?? []
    return (['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => {
      const questions = list.filter((question) => question.difficulty === difficulty)
      return { difficulty, total: questions.length, correct: questions.filter((question) => answers[question.id] === question.correct_answer).length }
    })
  }, [answers, quiz])

  const startGeneration = async () => {
    if (!file) { setError('Upload study material before generating your quiz.'); return }
    setError(''); setProgressStep(0); setStage('generating')
    try { setQuiz(await generateQuiz(file)); setStage('taking') } catch (generationError) { console.error('Quiz generation failed:', generationError); setError('Could not generate the quiz. Please try again.'); setStage('upload') }
  }

  const reset = () => { setStage('upload'); setQuiz(null); setFile(null); setAnswers({}); setCurrent(0); setError('') }

  if (stage === 'generating') return <main className="mx-auto max-w-3xl p-4 sm:p-10"><section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10"><Sparkles className="size-8 text-primary" /><h1 className="mt-5 font-serif text-3xl font-bold">Creating Your Quiz...</h1><p className="mt-2 text-sm text-muted-foreground">Turning your study material into practice questions.</p><div className="mt-8 space-y-4">{steps.map((step, index) => <div key={step} className="flex items-center gap-3 text-sm"><span className={cn('grid size-6 place-items-center rounded-full border', index < progressStep ? 'border-success bg-success text-success-foreground' : index === progressStep ? 'animate-pulse border-primary text-primary' : 'border-border text-muted-foreground')}>{index < progressStep ? <Check className="size-4" /> : index === progressStep ? '→' : '○'}</span>{step}</div>)}</div></section></main>

  if (stage === 'taking' && quiz) {
    const question = quiz.questions[current]
    const answered = answers[question.id]
    return <main className="mx-auto max-w-3xl p-4 sm:p-10"><div className="mb-6 flex items-center justify-between gap-3"><button onClick={onBackToDashboard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Dashboard</button><span className="text-sm font-semibold">{Object.keys(answers).length} / 20 answered</span></div><div className="mb-5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / 20) * 100}%` }} /></div><QuestionCard question={question} answer={answered} onAnswer={(answer) => setAnswers((previous) => ({ ...previous, [question.id]: answer }))} /><button disabled={!answered} onClick={() => current === 19 ? setStage('result') : setCurrent((value) => value + 1)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{current === 19 ? 'Finish Quiz' : 'Next Question'}<ArrowRight className="size-4" /></button></main>
  }

  if ((stage === 'result' || stage === 'review') && quiz) {
    const percentage = Math.round((score / 20) * 100)
    const reviewQuestions = quiz.questions.filter((question) => filter === 'all' || (filter === 'correct' ? answers[question.id] === question.correct_answer : answers[question.id] !== question.correct_answer))
    return <main className="mx-auto max-w-4xl p-4 sm:p-10"><div className="flex flex-wrap items-center justify-between gap-3"><button onClick={() => setStage('result')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Results</button><button onClick={reset} className="flex items-center gap-2 text-sm text-primary"><RotateCcw className="size-4" /> Create another quiz</button></div>{stage === 'result' ? <><section className="mt-6 rounded-3xl bg-primary p-8 text-center text-primary-foreground"><Trophy className="mx-auto size-10" /><h1 className="mt-3 font-serif text-3xl font-bold">Quiz Complete!</h1><p className="mt-4 text-5xl font-bold">{score} / 20</p><p className="mt-1 text-primary-foreground/75">{percentage}%</p></section><section className="mt-6 rounded-3xl border border-border bg-card p-6"><h2 className="font-serif text-xl font-bold">Difficulty breakdown</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{counts.map((item) => <div key={item.difficulty} className="rounded-2xl bg-muted p-4"><DifficultyBadge difficulty={item.difficulty} /><p className="mt-3 text-lg font-bold">{item.correct} / {item.total}</p></div>)}</div><button onClick={() => setStage('review')} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Review Answers</button><button onClick={onBackToDashboard} className="mt-3 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold">Back to Student Dashboard</button></section></> : <><h1 className="mt-6 font-serif text-3xl font-bold">Review Answers</h1><div className="mt-5 flex gap-2 overflow-x-auto">{(['all', 'correct', 'incorrect'] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={cn('rounded-full px-4 py-2 text-sm font-semibold capitalize', filter === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{value}</button>)}</div><div className="mt-6 space-y-5">{reviewQuestions.map((question) => <div key={question.id}><div className="mb-2 flex items-center gap-2 text-sm font-semibold">{answers[question.id] === question.correct_answer ? <Check className="size-4 text-success" /> : <CircleAlert className="size-4 text-destructive" />}{answers[question.id] === question.correct_answer ? 'Correct' : 'Incorrect'}</div><QuestionCard question={question} answer={answers[question.id]} result /></div>)}</div></>}</main>
  }

  return <main className="mx-auto max-w-3xl p-4 sm:p-10"><button onClick={onBackToDashboard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Student Dashboard</button><section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10"><div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-6" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Student learning tools</p><h1 className="font-serif text-3xl font-bold">AI Quiz Generator</h1></div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">Upload your study material and let AI turn it into a 20-question quiz.</p><div className="mt-8"><FileUploader onFile={setFile} /></div><div className="mt-6 rounded-2xl bg-muted p-4 text-sm"><p className="font-semibold">Quiz configuration</p><p className="mt-1 text-muted-foreground">20 questions · 7 Easy · 8 Medium · 5 Hard</p></div>{error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}<button onClick={() => void startGeneration()} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:brightness-110">Generate Quiz</button></section></main>
}
