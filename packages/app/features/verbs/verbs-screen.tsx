'use client'
import { useState } from 'react'
import { VerbsGrid } from './components/VerbsGrid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import { SUPPORTED_LANGUAGES } from '@repo/schema'
import type { VerbRow } from '@repo/database'

interface VerbsScreenProps {
  initialVerbs: VerbRow[]
}

export function VerbsScreen({ initialVerbs }: VerbsScreenProps) {
  const [language, setLanguage] = useState<string>('all')
  const filtered =
    language === 'all'
      ? initialVerbs
      : initialVerbs.filter((v) => v.language === language)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verbs</h1>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} className="capitalize">
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <VerbsGrid verbs={filtered} />
    </div>
  )
}
