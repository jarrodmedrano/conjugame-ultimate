'use client'
import type { LeaderboardRow } from '@repo/database'

interface LeaderboardTableProps {
  rows: LeaderboardRow[]
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No scores yet. Be the first!
      </p>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="p-3 text-left font-medium">#</th>
            <th className="p-3 text-left font-medium">Player</th>
            <th className="p-3 text-left font-medium">Language</th>
            <th className="p-3 text-right font-medium">Score</th>
            <th className="p-3 text-right font-medium">Quizzes</th>
            <th className="p-3 text-right font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.user_id}-${row.language}`}
              className="hover:bg-muted/30 border-b last:border-0"
            >
              <td className="text-muted-foreground p-3">{i + 1}</td>
              <td className="p-3 font-medium">
                {row.username || row.name || 'Anonymous'}
              </td>
              <td className="p-3 capitalize">{row.language}</td>
              <td className="p-3 text-right font-semibold">
                {row.total_score}
              </td>
              <td className="text-muted-foreground p-3 text-right">
                {row.total_quizzes}
              </td>
              <td className="text-muted-foreground p-3 text-right">
                {row.best_score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
