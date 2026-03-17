'use client'
import type { UserProgressRow } from '@repo/database'

interface QuizHistoryTableProps {
  history: UserProgressRow[]
}

export function QuizHistoryTable({ history }: QuizHistoryTableProps) {
  if (history.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center">
        No quiz history yet.
      </p>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="p-3 text-left font-medium">Date</th>
            <th className="p-3 text-left font-medium">Language</th>
            <th className="p-3 text-right font-medium">Score</th>
            <th className="p-3 text-right font-medium">Correct</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-muted/30 border-b last:border-0"
            >
              <td className="text-muted-foreground p-3">
                {row.completed_at
                  ? new Date(row.completed_at).toLocaleDateString()
                  : '—'}
              </td>
              <td className="p-3 capitalize">{row.language}</td>
              <td className="p-3 text-right font-semibold">{row.score}</td>
              <td className="text-muted-foreground p-3 text-right">
                {row.correct_answers}/{row.total_questions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
