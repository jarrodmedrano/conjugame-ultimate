'use client'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        <span>Question {current} of {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
