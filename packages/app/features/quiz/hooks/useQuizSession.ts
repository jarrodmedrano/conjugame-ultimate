import { useState, useCallback, useEffect } from 'react'
import type { QuestionRow } from '@repo/database'

export type QuizStatus = 'idle' | 'active' | 'complete'

interface QuizState {
  status: QuizStatus
  questions: QuestionRow[]
  currentIndex: number
  score: number
  correctAnswers: number
  selectedAnswer: number | null
}

export function useQuizSession(questions: QuestionRow[]) {
  const [state, setState] = useState<QuizState>({
    status: questions.length > 0 ? 'active' : 'idle',
    questions,
    currentIndex: 0,
    score: 0,
    correctAnswers: 0,
    selectedAnswer: null,
  })

  useEffect(() => {
    if (questions.length > 0) {
      setState({
        status: 'active',
        questions,
        currentIndex: 0,
        score: 0,
        correctAnswers: 0,
        selectedAnswer: null,
      })
    } else {
      setState((prev) => ({ ...prev, status: 'idle' }))
    }
  }, [questions])

  const currentQuestion = state.questions[state.currentIndex] ?? null
  const isLastQuestion = state.currentIndex === state.questions.length - 1

  const selectAnswer = useCallback((answerIndex: number) => {
    setState((prev) => ({ ...prev, selectedAnswer: answerIndex }))
  }, [])

  const nextQuestion = useCallback(() => {
    if (state.selectedAnswer === null) return
    const question = state.questions[state.currentIndex]
    if (!question) return

    const isCorrect = question.answers[state.selectedAnswer]?.correct ?? false

    if (isLastQuestion) {
      setState((prev) => ({
        ...prev,
        status: 'complete',
        score: isCorrect ? prev.score + 10 : prev.score,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      }))
    } else {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        score: isCorrect ? prev.score + 10 : prev.score,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      }))
    }
  }, [isLastQuestion, state.selectedAnswer, state.currentIndex, state.questions])

  return { state, currentQuestion, isLastQuestion, selectAnswer, nextQuestion }
}
