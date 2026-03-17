'use client'
import { Button } from '@repo/ui/components/ui/button'

interface QuizResultsProps {
  score: number
  correctAnswers: number
  totalQuestions: number
  language: string
  onPlayAgain: () => void
  onViewLeaderboard: () => void
}

export function QuizResults({
  score,
  correctAnswers,
  totalQuestions,
  language,
  onPlayAgain,
  onViewLeaderboard,
}: QuizResultsProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Quiz Complete!</h2>
        <p className="text-muted-foreground capitalize">
          {language} conjugation
        </p>
      </div>
      <div className="bg-secondary space-y-4 rounded-xl p-8">
        <div className="text-primary text-5xl font-bold">{score}</div>
        <div className="text-muted-foreground text-sm">points</div>
        <div className="text-lg">
          {correctAnswers} / {totalQuestions} correct ({percentage}%)
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onViewLeaderboard}>
          View Leaderboard
        </Button>
        <Button onClick={onPlayAgain}>Play Again</Button>
      </div>
    </div>
  )
}
