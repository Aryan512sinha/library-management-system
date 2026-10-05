import { mockQuiz } from './mockQuizData'
import type { Quiz } from './quiz-types'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export async function generateQuiz(file: File): Promise<Quiz> {
  if (!file) throw new Error('A study material file is required.')

  if (apiUrl) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`${apiUrl}/api/quiz/generate`, { method: 'POST', body: formData })
    if (!response.ok) throw new Error('The quiz service could not generate a quiz.')
    return response.json() as Promise<Quiz>
  }

  await new Promise((resolve) => setTimeout(resolve, 700))
  return mockQuiz
}

export async function getQuiz(quizId: string): Promise<Quiz> {
  if (quizId === mockQuiz.id) return mockQuiz
  throw new Error('Quiz not found.')
}

export async function submitQuiz(quizId: string, answers: Record<number, string>) {
  return { quizId, answers }
}

export async function getQuizHistory(): Promise<Quiz[]> {
  return []
}
