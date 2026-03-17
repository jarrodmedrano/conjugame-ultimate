'use client'
import type { UserProgressRow } from '@repo/database'

interface QuizHistoryTableProps {
  history: UserProgressRow[]
}

export function QuizHistoryTable({ history }: QuizHistoryTableProps) {
  if (history.length === 0) {
    return <p className="text-muted-foreground text-center py-6">No quiz history yet.</p>
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Date</th>
            <th className="text-left p-3 font-medium">Language</th>
            <th className="text-right p-3 font-medium">Score</th>
            <th className="text-right p-3 font-medium">Correct</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3 text-muted-foreground">
                {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}
              </td>
              <td className="p-3 capitalize">{row.language}</td>
              <td className="p-3 text-right font-semibold">{row.score}</td>
              <td className="p-3 text-right text-muted-foreground">
                {row.correct_answers}/{row.total_questions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
