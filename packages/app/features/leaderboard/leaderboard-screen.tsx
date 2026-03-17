'use client'
import { useState } from 'react'
import { LeaderboardTable } from './components/LeaderboardTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select'
import { SUPPORTED_LANGUAGES } from '@repo/schema'
import type { LeaderboardRow } from '@repo/database'

interface LeaderboardScreenProps {
  initialRows: LeaderboardRow[]
}

export function LeaderboardScreen({ initialRows }: LeaderboardScreenProps) {
  const [language, setLanguage] = useState<string>('all')
  const filtered = language === 'all'
    ? initialRows
    : initialRows.filter((r) => r.language === language)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
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
      <LeaderboardTable rows={filtered} />
    </div>
  )
}
