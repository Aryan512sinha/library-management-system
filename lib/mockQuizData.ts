import type { Quiz } from './quiz-types'

const questions = [
  ['easy', 'Which skill helps a person share ideas clearly with others?', 'Communication'],
  ['easy', 'What is a useful result of effective teamwork?', 'Shared progress'],
  ['easy', 'Which activity is an example of time management?', 'Planning tasks'],
  ['easy', 'What does self-management involve?', 'Managing your own actions'],
  ['easy', 'Which behavior supports good communication?', 'Active listening'],
  ['easy', 'What is a leader responsible for encouraging?', 'A shared direction'],
  ['easy', 'What should you do when a teammate needs help?', 'Offer support'],
  ['medium', 'Why is feedback useful in a team?', 'It helps improve performance'],
  ['medium', 'Which approach best resolves a disagreement?', 'Discuss the issue respectfully'],
  ['medium', 'What makes a goal easier to manage?', 'Breaking it into steps'],
  ['medium', 'Why should priorities be reviewed regularly?', 'Circumstances can change'],
  ['medium', 'How does empathy improve communication?', 'It helps you understand another perspective'],
  ['medium', 'What is delegation?', 'Assigning suitable work to others'],
  ['medium', 'Which habit reduces distractions?', 'Setting focused work periods'],
  ['medium', 'What does accountability mean?', 'Taking responsibility for outcomes'],
  ['hard', 'Which leadership style builds ownership in a capable team?', 'Giving autonomy with clear expectations'],
  ['hard', 'What is the best first step when a project falls behind?', 'Identify the cause and revise the plan'],
  ['hard', 'Why should a difficult message be adapted to its audience?', 'Different audiences need different context'],
  ['hard', 'What balances confidence and openness in a leader?', 'Decisiveness while considering feedback'],
  ['hard', 'How can self-management support long-term performance?', 'It turns goals into consistent habits'],
] as const

export const mockQuiz: Quiz = {
  id: 'mock-soft-skills',
  title: 'Introduction to Soft Skills',
  questions: questions.map(([difficulty, question, answer], index) => ({
    id: index + 1,
    difficulty,
    question,
    options: {
      A: answer,
      B: 'Avoiding all discussion',
      C: 'Waiting for someone else to decide',
      D: 'Completing unrelated tasks',
    },
    correct_answer: 'A',
    explanation: `${answer} is a core ${difficulty} soft-skill concept that supports effective study and work.`,
  })),
}
