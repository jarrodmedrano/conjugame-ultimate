'use client'
import { useState } from 'react'
import { Button } from '@repo/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { SUPPORTED_LANGUAGES, DIFFICULTY_LEVELS } from '@repo/schema'
import type { QuizSetupInput } from '@repo/schema'

interface QuizSetupProps {
  onStart: (config: QuizSetupInput) => void
  isLoading?: boolean
}

export function QuizSetup({ onStart, isLoading }: QuizSetupProps) {
  const [language, setLanguage] = useState<string>('spanish')
  const [difficulty, setDifficulty] = useState<string>('medium')
  const [questionCount, setQuestionCount] = useState<number>(10)

  const handleStart = () => {
    onStart({
      language: language as QuizSetupInput['language'],
      difficulty: difficulty as QuizSetupInput['difficulty'],
      questionCount,
    })
  }

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-2">
        <label className="text-sm font-medium">Language</label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} className="capitalize">
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Difficulty</label>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={d} className="capitalize">
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Questions</label>
        <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={handleStart} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Start Quiz'}
      </Button>
    </div>
  )
}
