'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import type { GenerateEntityFormProps } from './GenerateEntityForm.types'
import type { GenerateEntityResponse } from '../../../../../../apps/next/lib/ai/types'

export function GenerateEntityForm({
  entityType,
  stories = [],
  defaultStoryId,
  userId,
  onGenerated,
  onCancel,
}: GenerateEntityFormProps) {
  const [prompt, setPrompt] = useState('')
  const [storyId, setStoryId] = useState<number | undefined>(defaultStoryId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showApiKeyGate, setShowApiKeyGate] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)
    setShowApiKeyGate(false)

    try {
      const response = await fetch(`/api/generate/${entityType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, prompt: prompt.trim(), storyId }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'api_key_required') {
          setShowApiKeyGate(true)
          return
        }
        throw new Error(data.error || 'Generation failed')
      }

      const result = (await response.json()) as GenerateEntityResponse
      onGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const singularLabel = entityType === 'story' ? 'story' : entityType

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Generate with AI</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Enter manually
        </Button>
      </div>

      {stories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="generate-story">Link to story (optional)</Label>
          <Select
            value={storyId ? String(storyId) : ''}
            onValueChange={(val) => setStoryId(val ? Number(val) : undefined)}
          >
            <SelectTrigger id="generate-story">
              <SelectValue placeholder="Select a story for context..." />
            </SelectTrigger>
            <SelectContent>
              {stories.map((story) => (
                <SelectItem key={story.id} value={String(story.id)}>
                  {story.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Linking a story helps the AI stay consistent with your existing
            world.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="generate-prompt">Describe the {singularLabel}</Label>
        <Textarea
          id="generate-prompt"
          placeholder={`e.g. "A mysterious blacksmith who knows the hero's secret"`}
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {showApiKeyGate && (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-sm font-medium">AI Generation Unavailable</p>
          <p className="text-muted-foreground text-sm">
            Add your own Anthropic or OpenAI API key to generate content, or
            upgrade to Pro where AI is included.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={userId ? `/${userId}#ai-keys` : '/profile#ai-keys'}>
                Add API Key
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href="/about/pricing">Upgrade to Pro</a>
            </Button>
          </div>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate
          </>
        )}
      </Button>
    </div>
  )
}
