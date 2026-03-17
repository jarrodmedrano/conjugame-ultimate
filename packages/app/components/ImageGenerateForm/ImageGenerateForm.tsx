'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import { useImageGenerate } from './useImageGenerate'
import { IMAGE_STYLES } from '../../../../apps/next/lib/validations/generate-image'
import type {
  ImageGenerateFormProps,
  ImageStyle,
} from './ImageGenerateForm.types'

const STYLE_LABELS: Record<ImageStyle, string> = {
  'sci-fi': 'Sci-Fi',
  fantasy: 'Fantasy',
  realistic: 'Realistic',
  noir: 'Noir',
  drama: 'Drama',
  comedy: 'Comedy',
  horror: 'Horror',
}

export function ImageGenerateForm({
  entityType,
  entityName,
  entityDescription,
  entityId,
  isPrimary,
  onGenerated,
  onCancel,
}: ImageGenerateFormProps) {
  const {
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
  } = useImageGenerate({
    entityType,
    entityName,
    entityDescription,
    entityId,
    isPrimary,
    onGenerated,
  })

  const handleStyleClick = (s: ImageStyle) => {
    setStyle(style === s ? undefined : s)
  }

  return (
    <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">Generate with AI</span>
      </div>

      {previewImage ? (
        /* Preview state */
        <div className="space-y-3">
          <img
            src={previewImage.cloudinaryUrl}
            alt="AI generated"
            className="w-full rounded-lg object-cover"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleUseImage}
              size="sm"
              className="flex-1"
            >
              Use this image
            </Button>
            <Button
              type="button"
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Try again
            </Button>
            <Button type="button" onClick={onCancel} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Form state */
        <div className="space-y-3">
          {/* Style pills */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">
              Style (optional)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {IMAGE_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStyleClick(s)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    style === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600',
                  ].join(' ')}
                >
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <Label
              htmlFor="image-gen-prompt"
              className="text-muted-foreground text-xs"
            >
              Prompt
            </Label>
            <Textarea
              id="image-gen-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Describe the image..."
              disabled={isGenerating}
            />
            <p className="text-muted-foreground text-right text-xs">
              {prompt.length}/500
            </p>
          </div>

          {/* API key gate */}
          {showApiKeyGate && (
            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <p className="font-medium">OpenAI API key required</p>
              <p className="mt-1">
                Image generation uses DALL-E 3 and requires an OpenAI API key.{' '}
                <a href="/profile" className="underline hover:no-underline">
                  Add your OpenAI key in profile settings.
                </a>
              </p>
            </div>
          )}

          {/* Generic error */}
          {error && !showApiKeyGate && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Generate
                </>
              )}
            </Button>
            <Button type="button" onClick={onCancel} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
