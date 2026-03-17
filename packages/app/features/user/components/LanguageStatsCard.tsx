'use client'
import type { UserLanguageStatsRow } from '@repo/database'

interface LanguageStatsCardProps {
  stats: UserLanguageStatsRow
}

export function LanguageStatsCard({ stats }: LanguageStatsCardProps) {
  const accuracy =
    stats.total_questions > 0
      ? Math.round((stats.total_correct / stats.total_questions) * 100)
      : 0

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-lg font-semibold capitalize">{stats.language}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Total Score</p>
          <p className="text-xl font-bold">{stats.total_score}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Best Score</p>
          <p className="text-xl font-bold">{stats.best_score}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Quizzes</p>
          <p className="font-semibold">{stats.total_quizzes}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Accuracy</p>
          <p className="font-semibold">{accuracy}%</p>
        </div>
      </div>
    </div>
  )
}
