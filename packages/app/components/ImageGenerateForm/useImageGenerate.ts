// packages/app/components/ImageGenerateForm/useImageGenerate.ts
import { useState } from 'react'
import type { ImageStyle } from './ImageGenerateForm.types'
import type { EntityImage } from '../../types/entity-image'

interface UseImageGenerateOptions {
  entityType: 'character' | 'location' | 'story' | 'timeline'
  entityName: string
  entityDescription: string
  entityId: number
  isPrimary: boolean
  onGenerated: (image: EntityImage) => void
}

const MAX_PROMPT_LENGTH = 500

function buildDefaultPrompt(
  entityType: string,
  entityName: string,
  entityDescription: string,
): string {
  const base = `A ${entityType} named ${entityName}.`
  const full = entityDescription ? `${base} ${entityDescription}` : base
  return full.length > MAX_PROMPT_LENGTH
    ? full.slice(0, MAX_PROMPT_LENGTH)
    : full
}

export function useImageGenerate({
  entityType,
  entityName,
  entityDescription,
  entityId,
  isPrimary,
  onGenerated,
}: UseImageGenerateOptions) {
  const [prompt, setPrompt] = useState(() =>
    buildDefaultPrompt(entityType, entityName, entityDescription),
  )
  const [style, setStyle] = useState<ImageStyle | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showApiKeyGate, setShowApiKeyGate] = useState(false)
  const [previewImage, setPreviewImage] = useState<EntityImage | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)
    setShowApiKeyGate(false)
    setPreviewImage(null)

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityName,
          entityDescription,
          customPrompt: prompt.trim(),
          style,
          entityId: String(entityId),
          isPrimary,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'api_key_required') {
          setShowApiKeyGate(true)
          return
        }
        throw new Error(data.error || 'Generation failed')
      }

      setPreviewImage(data.image as EntityImage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseImage = () => {
    if (previewImage) onGenerated(previewImage)
  }

  const handleRetry = () => {
    setPreviewImage(null)
  }

  return {
    prompt,
    setPrompt,
    style,
    setStyle,
    isGenerating,
    error,
    showApiKeyGate,
    previewImage,
    handleGenerate,
    handleUseImage,
    handleRetry,
  }
}
