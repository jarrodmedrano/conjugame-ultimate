import { useState, useCallback } from 'react'
import type { QuestionRow } from '@repo/database'

export type QuizStatus = 'idle' | 'active' | 'complete'

interface QuizState {
  status: QuizStatus
  questions: QuestionRow[]
  currentIndex: number
  score: number
  correctAnswers: number
  selectedAnswer: number | null
  showResult: boolean
}

export function useQuizSession(questions: QuestionRow[]) {
  const [state, setState] = useState<QuizState>({
    status: questions.length > 0 ? 'active' : 'idle',
    questions,
    currentIndex: 0,
    score: 0,
    correctAnswers: 0,
    selectedAnswer: null,
    showResult: false,
  })

  const currentQuestion = state.questions[state.currentIndex] ?? null
  const isLastQuestion = state.currentIndex === state.questions.length - 1

  const selectAnswer = useCallback((answerIndex: number) => {
    if (state.selectedAnswer !== null) return
    const question = state.questions[state.currentIndex]
    if (!question) return

    const answers = question.answers as { text: string; correct: boolean }[]
    const isCorrect = answers[answerIndex]?.correct ?? false

    setState((prev) => ({
      ...prev,
      selectedAnswer: answerIndex,
      showResult: true,
      score: isCorrect ? prev.score + 10 : prev.score,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
    }))
  }, [state.selectedAnswer, state.currentIndex, state.questions])

  const nextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setState((prev) => ({ ...prev, status: 'complete' }))
    } else {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        showResult: false,
      }))
    }
  }, [isLastQuestion])

  return { state, currentQuestion, isLastQuestion, selectAnswer, nextQuestion }
}
