'use client'
import { Button } from '@repo/ui/components/ui/button'
import type { QuestionRow } from '@repo/database'

interface QuizQuestionProps {
  question: QuestionRow
  selectedAnswer: number | null
  onSelectAnswer: (index: number) => void
}

export function QuizQuestion({
  question,
  selectedAnswer,
  onSelectAnswer,
}: QuizQuestionProps) {
  const answers = question.answers as { text: string; correct: boolean }[]

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm uppercase tracking-wide">
          {question.tense}
        </p>
        <h2 className="text-2xl font-semibold">{question.text}</h2>
        {question.translation && (
          <p className="text-muted-foreground text-sm italic">
            {question.translation}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {answers.map((answer, index) => (
          <Button
            key={index}
            variant={selectedAnswer === index ? 'secondary' : 'outline'}
            className="h-auto justify-start px-4 py-3 text-left"
            onClick={() => onSelectAnswer(index)}
          >
            {answer.text}
          </Button>
        ))}
      </div>
    </div>
  )
}
