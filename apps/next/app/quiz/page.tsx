'use client'
import { useCookies } from 'next-client-cookies'
import { Header } from '@app/components/header'
import { MinimalFooter } from '@repo/ui/components/tailwind/minimal-footer'
import { QuizScreen } from '@app/features/quiz/quiz-screen'

export default function QuizPage() {
  const cookies = useCookies()

  return (
    <div className="flex min-h-screen flex-col">
      <Header cookies={cookies} />
      <main className="container mx-auto max-w-2xl grow px-4 py-24">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Conjugation Quiz</h1>
          <p className="text-muted-foreground mt-2">
            Test your verb conjugation skills
          </p>
        </div>
        <QuizScreen />
      </main>
      <MinimalFooter />
    </div>
  )
}
