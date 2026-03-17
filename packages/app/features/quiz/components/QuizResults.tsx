'use client'
import { Button } from '@repo/ui/components/button'

interface QuizResultsProps {
  score: number
  correctAnswers: number
  totalQuestions: number
  language: string
  onPlayAgain: () => void
  onViewLeaderboard: () => void
}

export function QuizResults({ score, correctAnswers, totalQuestions, language, onPlayAgain, onViewLeaderboard }: QuizResultsProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Quiz Complete!</h2>
        <p className="text-muted-foreground capitalize">{language} conjugation</p>
      </div>
      <div className="bg-secondary rounded-xl p-8 space-y-4">
        <div className="text-5xl font-bold text-primary">{score}</div>
        <div className="text-sm text-muted-foreground">points</div>
        <div className="text-lg">
          {correctAnswers} / {totalQuestions} correct ({percentage}%)
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onViewLeaderboard}>View Leaderboard</Button>
        <Button onClick={onPlayAgain}>Play Again</Button>
      </div>
    </div>
  )
}
