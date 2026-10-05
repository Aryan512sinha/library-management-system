export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnswerKey = 'A' | 'B' | 'C' | 'D'

export type Question = {
  id: number
  difficulty: Difficulty
  question: string
  options: Record<AnswerKey, string>
  correct_answer: AnswerKey
  explanation: string
}

export type Quiz = {
  id: string
  title: string
  questions: Question[]
}

export type QuizAnswers = Record<number, AnswerKey | undefined>
