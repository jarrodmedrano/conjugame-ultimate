'use client'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'
import type { QuestionRow } from '@repo/database'

interface QuizQuestionProps {
  question: QuestionRow
  selectedAnswer: number | null
  showResult: boolean
  onSelectAnswer: (index: number) => void
}

export function QuizQuestion({ question, selectedAnswer, showResult, onSelectAnswer }: QuizQuestionProps) {
  const answers = question.answers as { text: string; correct: boolean }[]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{question.tense}</p>
        <h2 className="text-2xl font-semibold">{question.text}</h2>
        {question.translation && (
          <p className="text-sm text-muted-foreground italic">{question.translation}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {answers.map((answer, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = answer.correct
          let variant: 'outline' | 'default' | 'destructive' | 'secondary' = 'outline'
          if (showResult && isSelected && isCorrect) variant = 'default'
          else if (showResult && isSelected && !isCorrect) variant = 'destructive'
          else if (showResult && isCorrect) variant = 'secondary'

          return (
            <Button
              key={index}
              variant={variant}
              className={cn('h-auto py-3 px-4 text-left justify-start',
                showResult && isCorrect && 'border-green-500'
              )}
              onClick={() => onSelectAnswer(index)}
              disabled={showResult}
            >
              {answer.text}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
