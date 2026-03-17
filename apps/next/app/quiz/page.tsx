import { QuizScreen } from '@app/features/quiz/quiz-screen'

export const metadata = { title: 'Quiz — Conjugame' }

export default function QuizPage() {
  return (
    <main className="container max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Conjugation Quiz</h1>
        <p className="text-muted-foreground mt-2">Test your verb conjugation skills</p>
      </div>
      <QuizScreen />
    </main>
  )
}
