'use client'
import type { LeaderboardRow } from '@repo/database'

interface LeaderboardTableProps {
  rows: LeaderboardRow[]
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No scores yet. Be the first!</p>
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">#</th>
            <th className="text-left p-3 font-medium">Player</th>
            <th className="text-left p-3 font-medium">Language</th>
            <th className="text-right p-3 font-medium">Score</th>
            <th className="text-right p-3 font-medium">Quizzes</th>
            <th className="text-right p-3 font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.user_id}-${row.language}`} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3 text-muted-foreground">{i + 1}</td>
              <td className="p-3 font-medium">{row.username || row.name || 'Anonymous'}</td>
              <td className="p-3 capitalize">{row.language}</td>
              <td className="p-3 text-right font-semibold">{row.total_score}</td>
              <td className="p-3 text-right text-muted-foreground">{row.total_quizzes}</td>
              <td className="p-3 text-right text-muted-foreground">{row.best_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
