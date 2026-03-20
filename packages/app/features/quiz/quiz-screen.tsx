'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuizSetup } from './components/QuizSetup'
import { QuizQuestion } from './components/QuizQuestion'
import { QuizResults } from './components/QuizResults'
import { ProgressBar } from './components/ProgressBar'
import { Button } from '@repo/ui/components/ui/button'
import { useQuizSession } from './hooks/useQuizSession'
import type { QuizSetupInput } from '@repo/schema'
import type { QuestionRow } from '@repo/database'

interface QuizScreenProps {
  initialQuestions?: QuestionRow[]
  initialSetup?: QuizSetupInput
}

export function QuizScreen({
  initialQuestions = [],
  initialSetup,
}: QuizScreenProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions)
  const [setup, setSetup] = useState<QuizSetupInput | null>(
    initialSetup ?? null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [fetchedEmpty, setFetchedEmpty] = useState(false)

  const { state, currentQuestion, selectAnswer, nextQuestion } =
    useQuizSession(questions)

  const handleStart = useCallback(async (config: QuizSetupInput) => {
    setIsLoading(true)
    setSetup(config)
    try {
      const params = new URLSearchParams({
        language: config.language,
        difficulty: config.difficulty,
        count: String(config.questionCount),
        random: 'true',
      })
      const res = await fetch(`/api/questions?${params}`)
      const data = await res.json()
      const fetched = data.questions || []
      setQuestions(fetched)
      setFetchedEmpty(fetched.length === 0)
    } catch {
      setQuestions([])
      setFetchedEmpty(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePlayAgain = useCallback(() => {
    setQuestions([])
    setSetup(null)
    setFetchedEmpty(false)
  }, [])

  const handleSubmitQuiz = useCallback(async () => {
    if (!setup) return
    try {
      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: setup.language,
          difficulty: setup.difficulty,
          score: state.score,
          totalQuestions: questions.length,
          correctAnswers: state.correctAnswers,
        }),
      })
    } catch {
      // non-critical
    }
  }, [setup, state.score, state.correctAnswers, questions.length])

  useEffect(() => {
    if (state.status === 'complete') {
      handleSubmitQuiz()
    }
  }, [state.status, handleSubmitQuiz])

  if (state.status === 'complete') {
    return (
      <QuizResults
        score={state.score}
        correctAnswers={state.correctAnswers}
        totalQuestions={questions.length}
        language={setup?.language || ''}
        onPlayAgain={handlePlayAgain}
        onViewLeaderboard={() => router.push('/leaderboard')}
      />
    )
  }

  if (questions.length === 0 || !setup) {
    return (
      <QuizSetup
        onStart={handleStart}
        isLoading={isLoading}
        noResults={fetchedEmpty}
      />
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="space-y-6">
      <ProgressBar current={state.currentIndex + 1} total={questions.length} />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground capitalize">
          {setup.language} • {setup.difficulty}
        </span>
        <span className="font-semibold">{state.score} pts</span>
      </div>
      <QuizQuestion
        question={currentQuestion}
        selectedAnswer={state.selectedAnswer}
        onSelectAnswer={selectAnswer}
      />
      {state.selectedAnswer !== null && (
        <Button className="w-full" onClick={nextQuestion}>
          {state.currentIndex === questions.length - 1
            ? 'See Results'
            : 'Next Question'}
        </Button>
      )}
    </div>
  )
}
