# AI Image Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Generate with AI" button to `ImageUpload` that uses the user's existing OpenAI key and DALL-E 3 to generate, upload to Cloudinary, and save an entity image.

**Architecture:** New `POST /api/generate/image` route decrypts the user's OpenAI key, calls DALL-E 3, fetches the returned image URL, uploads the buffer to Cloudinary, and inserts into `entity_images`. A new `ImageGenerateForm` component handles the UI (genre style pills + editable prompt) and is embedded inline in the existing `ImageUpload` component.

**Tech Stack:** Next.js App Router, OpenAI SDK (`openai` package already installed), Cloudinary v2, Zod, Tailwind CSS, Lucide React

---

## Task 1: Validation Schema

**Files:**

- Create: `apps/next/lib/validations/generate-image.ts`

**Step 1: Write the validation schema**

```typescript
// apps/next/lib/validations/generate-image.ts
import { z } from 'zod'

export const IMAGE_STYLES = [
  'sci-fi',
  'fantasy',
  'realistic',
  'noir',
  'drama',
  'comedy',
  'horror',
] as const

export type ImageStyle = (typeof IMAGE_STYLES)[number]

export const GenerateImageSchema = z.object({
  entityType: z.enum(['character', 'location', 'story', 'timeline']),
  entityName: z.string().min(1).max(100).trim(),
  entityDescription: z.string().max(5000).trim(),
  customPrompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(500, 'Prompt must be 500 characters or less')
    .trim(),
  style: z.enum(IMAGE_STYLES).optional(),
  entityId: z
    .string()
    .regex(/^\d+$/, 'Entity ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
  isPrimary: z.boolean().default(false),
})

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>
```

**Step 2: Commit**

```bash
git add apps/next/lib/validations/generate-image.ts
git commit -m "feat: add GenerateImageSchema validation"
```

---

## Task 2: API Route

**Files:**

- Create: `apps/next/app/api/generate/image/route.ts`

**Step 1: Write the route**

```typescript
// apps/next/app/api/generate/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { requireAuth } from '../../../../lib/auth-middleware'
import { GenerateImageSchema } from '../../../../lib/validations/generate-image'
import { decryptApiKey } from '../../../../lib/api-key-encryption'
import { cloudinary, CLOUDINARY_CONFIG } from '../../../../lib/cloudinary'
import { createEntityImage, countGalleryImages } from '@repo/database'
import pool from '../../../utils/open-pool'
import OpenAI from 'openai'
import { z } from 'zod'

const STYLE_SUFFIXES: Record<string, string> = {
  'sci-fi': ', in a sci-fi cinematic style',
  fantasy: ', in a fantasy illustration style',
  realistic: ', photorealistic, highly detailed',
  noir: ', in a noir cinematic style, high contrast black and white',
  drama: ', dramatic lighting, cinematic composition',
  comedy: ', colorful, lighthearted, cartoon illustration style',
  horror: ', dark and unsettling, horror atmosphere',
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  // 2. Authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    // 3. Look up OpenAI key specifically — DALL-E requires OpenAI
    const keyResult = await client.query<{
      encrypted_key: Buffer
      iv: Buffer
      auth_tag: Buffer
    }>(
      `SELECT encrypted_key, iv, auth_tag
       FROM user_api_keys
       WHERE user_id = $1 AND provider = 'openai'
       LIMIT 1`,
      [user.id],
    )

    if (keyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'api_key_required', provider: 'openai' },
        { status: 403 },
      )
    }

    const row = keyResult.rows[0]
    const rawApiKey = decryptApiKey({
      encryptedKey: row.encrypted_key,
      iv: row.iv,
      authTag: row.auth_tag,
      maskedKey: '',
    })

    // 4. Validate input
    const body = await request.json()
    const validated = GenerateImageSchema.parse(body)

    // 5. Check gallery limit if not primary
    if (!validated.isPrimary) {
      const countResult = await countGalleryImages(client, {
        entityType: validated.entityType,
        entityId: validated.entityId,
      })
      if (
        countResult &&
        Number(countResult.count) >= CLOUDINARY_CONFIG.MAX_GALLERY_SIZE
      ) {
        return NextResponse.json(
          {
            error: `Maximum ${CLOUDINARY_CONFIG.MAX_GALLERY_SIZE} gallery images allowed`,
          },
          { status: 400 },
        )
      }
    }

    // 6. Build DALL-E prompt
    const styleSuffix = validated.style
      ? STYLE_SUFFIXES[validated.style] ?? ''
      : ''
    const dallePrompt = `${validated.customPrompt}${styleSuffix}`

    // 7. Call DALL-E 3 — isolated catch to avoid leaking rawApiKey
    let imageUrl: string
    try {
      const openai = new OpenAI({ apiKey: rawApiKey })
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      })
      imageUrl = response.data[0]?.url ?? ''
      if (!imageUrl) throw new Error('No image URL returned')
    } catch {
      console.error('DALL-E generation failed for user:', user.id)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 },
      )
    }

    // 8. Fetch image buffer from DALL-E temporary URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch generated image' },
        { status: 500 },
      )
    }
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 9. Upload buffer to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: CLOUDINARY_CONFIG.FOLDER,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png'],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })

    // 10. Save to database
    if (validated.isPrimary) {
      await client.query(
        'UPDATE entity_images SET is_primary = FALSE WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE',
        [validated.entityType, validated.entityId],
      )
    }

    const imageRecord = await createEntityImage(client, {
      entityType: validated.entityType,
      entityId: validated.entityId,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      isPrimary: validated.isPrimary,
      displayOrder: 0,
      fileName: `ai-generated-${Date.now()}.png`,
      fileSize: buffer.length,
      width: uploadResult.width,
      height: uploadResult.height,
    })

    return NextResponse.json({ success: true, image: imageRecord })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Image generation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd apps/next && npx tsc --noEmit 2>&1 | grep "generate/image"
```

Expected: no errors for this file.

**Step 3: Commit**

```bash
git add apps/next/app/api/generate/image/route.ts
git commit -m "feat: add POST /api/generate/image route with DALL-E 3"
```

---

## Task 3: ImageGenerateForm Types

**Files:**

- Create: `packages/app/components/ImageGenerateForm/ImageGenerateForm.types.ts`

**Step 1: Write types**

```typescript
// packages/app/components/ImageGenerateForm/ImageGenerateForm.types.ts
import type { ImageStyle } from '../../../../../apps/next/lib/validations/generate-image'
import type { EntityImage } from '../../types/entity-image'

export type { ImageStyle }

export interface ImageGenerateFormProps {
  entityType: 'character' | 'location' | 'story' | 'timeline'
  entityName: string
  entityDescription: string
  entityId: number
  userId: string
  isPrimary: boolean
  onGenerated: (image: EntityImage) => void
  onCancel: () => void
}
```

**Step 2: Commit**

```bash
git add packages/app/components/ImageGenerateForm/ImageGenerateForm.types.ts
git commit -m "feat: add ImageGenerateForm types"
```

---

## Task 4: useImageGenerate Hook

**Files:**

- Create: `packages/app/components/ImageGenerateForm/useImageGenerate.ts`

**Step 1: Write the hook**

```typescript
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

function buildDefaultPrompt(
  entityType: string,
  entityName: string,
  entityDescription: string,
): string {
  const base = `A ${entityType} named ${entityName}.`
  return entityDescription ? `${base} ${entityDescription}` : base
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
```

**Step 2: Commit**

```bash
git add packages/app/components/ImageGenerateForm/useImageGenerate.ts
git commit -m "feat: add useImageGenerate hook"
```

---

## Task 5: ImageGenerateForm Component

**Files:**

- Create: `packages/app/components/ImageGenerateForm/ImageGenerateForm.tsx`
- Create: `packages/app/components/ImageGenerateForm/index.ts`

**Step 1: Write the component**

```typescript
// packages/app/components/ImageGenerateForm/ImageGenerateForm.tsx
'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import { useImageGenerate } from './useImageGenerate'
import { IMAGE_STYLES } from '../../../../../apps/next/lib/validations/generate-image'
import type { ImageGenerateFormProps, ImageStyle } from './ImageGenerateForm.types'

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
  userId: _userId,
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
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Form state */
        <div className="space-y-3">
          {/* Style pills */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
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
            <Label htmlFor="image-gen-prompt" className="text-xs text-muted-foreground">
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
            <p className="text-right text-xs text-muted-foreground">
              {prompt.length}/500
            </p>
          </div>

          {/* API key gate */}
          {showApiKeyGate && (
            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <p className="font-medium">OpenAI API key required</p>
              <p className="mt-1">
                Image generation uses DALL-E 3 and requires an OpenAI API key.{' '}
                <a
                  href="/profile"
                  className="underline hover:no-underline"
                >
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
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Write index.ts**

```typescript
// packages/app/components/ImageGenerateForm/index.ts
export { ImageGenerateForm } from './ImageGenerateForm'
export type { ImageGenerateFormProps } from './ImageGenerateForm.types'
```

**Step 3: Commit**

```bash
git add packages/app/components/ImageGenerateForm/
git commit -m "feat: add ImageGenerateForm component"
```

---

## Task 6: Update ImageUpload Types

**Files:**

- Modify: `packages/app/types/entity-image.ts`

**Step 1: Add entity context props to `ImageUploadProps`**

Add these fields to the existing `ImageUploadProps` interface (after `theme?: string`):

```typescript
  // Entity context for AI image generation — optional, omit to hide the generate button
  entityType?: 'character' | 'location' | 'story' | 'timeline'
  entityId?: number
  entityName?: string
  entityDescription?: string
  userId?: string
  onImageGenerated?: (image: EntityImage) => void
```

The full updated interface should be:

```typescript
export interface ImageUploadProps {
  existingImages: EntityImage[]
  onUpload: (file: File, isPrimary: boolean) => Promise<void>
  onDelete: (imageId: number) => Promise<void>
  onSetPrimary: (imageId: number) => Promise<void>
  maxImages?: number
  disabled?: boolean
  theme?: string
  // Entity context for AI image generation — optional, omit to hide the generate button
  entityType?: 'character' | 'location' | 'story' | 'timeline'
  entityId?: number
  entityName?: string
  entityDescription?: string
  userId?: string
  onImageGenerated?: (image: EntityImage) => void
}
```

**Step 2: Commit**

```bash
git add packages/app/types/entity-image.ts
git commit -m "feat: add entity context props to ImageUploadProps for AI generation"
```

---

## Task 7: Update ImageUpload Component

**Files:**

- Modify: `packages/app/components/ImageUpload/ImageUpload.tsx`

**Step 1: Add imports and `generateMode` state**

At the top of the file, add the import for `ImageGenerateForm`:

```typescript
import { ImageGenerateForm } from '../ImageGenerateForm'
import type { EntityImage } from '../../types/entity-image'
```

**Step 2: Update the function signature**

Add the new props to the destructured params:

```typescript
export function ImageUpload({
  existingImages,
  onUpload,
  onDelete,
  onSetPrimary,
  maxImages = 7,
  disabled = false,
  theme,
  entityType,
  entityId,
  entityName = '',
  entityDescription = '',
  userId,
  onImageGenerated,
}: ImageUploadProps) {
```

**Step 3: Add generate mode state**

After the existing `useState` calls, add:

```typescript
const [generateMode, setGenerateMode] = useState<'primary' | 'gallery' | null>(
  null,
)
```

**Step 4: Add generate handlers**

After the existing handlers, add:

```typescript
const canGenerate = Boolean(
  entityType && entityId && userId && onImageGenerated,
)

const handleGeneratePrimaryClick = () => {
  setGenerateMode('primary')
}

const handleGenerateGalleryClick = () => {
  setGenerateMode('gallery')
}

const handleGenerateCancel = () => {
  setGenerateMode(null)
}

const handleImageGenerated = (image: EntityImage) => {
  setGenerateMode(null)
  onImageGenerated?.(image)
}
```

**Step 5: Update the Primary Image dropzone**

Replace the existing `<Button>Browse file</Button>` block inside the empty primary image dropzone with two buttons side by side:

```tsx
<div className="flex gap-2">
  <Button
    type="button"
    onClick={handlePrimaryClick}
    disabled={disabled || isUploadingPrimary}
    variant="default"
    size="sm"
  >
    {isUploadingPrimary ? (
      <>
        <Spinner size="xs" variant="light" className="mr-2" />
        Uploading...
      </>
    ) : (
      'Browse file'
    )}
  </Button>
  {canGenerate && (
    <Button
      type="button"
      onClick={handleGeneratePrimaryClick}
      disabled={disabled || isUploadingPrimary}
      variant="outline"
      size="sm"
    >
      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
      Generate with AI
    </Button>
  )}
</div>
```

Add `import { Pin, X, Sparkles } from 'lucide-react'` (add `Sparkles` to the existing import).

**Step 6: Add `ImageGenerateForm` below the primary dropzone**

Immediately after the primary image section's closing `</div>` and before the Gallery section `<div>`, insert:

```tsx
{
  /* AI generate form for primary image */
}
{
  generateMode === 'primary' && canGenerate && (
    <ImageGenerateForm
      entityType={entityType!}
      entityName={entityName}
      entityDescription={entityDescription}
      entityId={entityId!}
      userId={userId!}
      isPrimary={true}
      onGenerated={handleImageGenerated}
      onCancel={handleGenerateCancel}
    />
  )
}
```

**Step 7: Update the Gallery dropzone**

Replace the existing `<Button>Browse files</Button>` inside the gallery dropzone with two buttons:

```tsx
<div className="flex gap-2">
  <Button
    type="button"
    onClick={handleGalleryClick}
    disabled={disabled || isUploadingGallery}
    variant="default"
    size="sm"
  >
    {isUploadingGallery ? (
      <>
        <Spinner size="xs" variant="light" className="mr-2" />
        Uploading...
      </>
    ) : (
      'Browse files'
    )}
  </Button>
  {canGenerate && (
    <Button
      type="button"
      onClick={handleGenerateGalleryClick}
      disabled={disabled || isUploadingGallery}
      variant="outline"
      size="sm"
    >
      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
      Generate with AI
    </Button>
  )}
</div>
```

**Step 8: Add `ImageGenerateForm` below the gallery dropzone**

After the gallery dropzone closing `</div>` and before the outer gallery `</div>`:

```tsx
{
  /* AI generate form for gallery image */
}
{
  generateMode === 'gallery' && canGenerate && (
    <ImageGenerateForm
      entityType={entityType!}
      entityName={entityName}
      entityDescription={entityDescription}
      entityId={entityId!}
      userId={userId!}
      isPrimary={false}
      onGenerated={handleImageGenerated}
      onCancel={handleGenerateCancel}
    />
  )
}
```

**Step 9: Verify TypeScript compiles**

```bash
cd /path/to/worktree && npx tsc --noEmit 2>&1 | grep -E "ImageUpload|ImageGenerateForm"
```

Expected: no errors.

**Step 10: Commit**

```bash
git add packages/app/components/ImageUpload/ImageUpload.tsx
git commit -m "feat: add Generate with AI button to ImageUpload"
```

---

## Task 8: Wire Up Entity Modals

Each entity edit modal already passes an `ImageUpload` component. You need to pass the new entity context props to each one.

**Files to modify (4 files):**

- `packages/app/features/characters/components/EditCharacterModal.tsx`
- `packages/app/features/stories/components/EditStoryModal.tsx`
- `packages/app/features/locations/components/EditLocationModal.tsx`
- `packages/app/features/timelines/components/EditTimelineModal.tsx`

For **each modal**, find the existing `<ImageUpload>` usage and add these props:

```tsx
<ImageUpload
  existingImages={formData.images}
  onUpload={handleImageUpload}
  onDelete={handleImageDelete}
  onSetPrimary={setAsPrimary}
  {/* ADD THESE: */}
  entityType="character"   {/* or "story", "location", "timeline" */}
  entityId={entity.id}
  entityName={formData.name}
  entityDescription={formData.description ?? ''}
  userId={userId}
  onImageGenerated={(image) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, image],
    }))
  }}
/>
```

**Note:** The `entityName` and `entityDescription` fields should reference the live form state (e.g. `formData.name`, `formData.description`) so the prompt reflects current edits.

**Step 1:** Update each modal one at a time, verifying TypeScript after each.

**Step 2:** Commit all four at once:

```bash
git add packages/app/features/characters/components/EditCharacterModal.tsx \
        packages/app/features/stories/components/EditStoryModal.tsx \
        packages/app/features/locations/components/EditLocationModal.tsx \
        packages/app/features/timelines/components/EditTimelineModal.tsx
git commit -m "feat: wire AI image generation into entity edit modals"
```

---

## Task 9: Wire Up Create Screens

The create flow uses `ImageUpload` too. Find where `ImageUpload` is used in create contexts and add the same entity context props.

**Files to check:**

- `packages/app/features/create/screen.tsx` or equivalent create form components

The entity `id` may not exist yet during creation. In this case, skip passing `entityId` — `canGenerate` will return `false` and the generate button will be hidden until after the entity is saved.

**Step 1:** Audit all `ImageUpload` usages:

```bash
grep -r "ImageUpload" packages/app/features --include="*.tsx" -l
```

**Step 2:** For each create-flow usage, pass entity context only if an `entityId` is available (post-save). If not available, omit all entity context props — the component degrades gracefully to upload-only.

**Step 3:** Commit:

```bash
git add packages/app/features/
git commit -m "feat: wire AI image generation into create flows where entity ID is available"
```

---

## Task 10: Final TypeScript Check

```bash
cd apps/next && npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors before proceeding. Common issues:

- Import paths — double-check relative paths between `packages/app` and `apps/next`
- `entityId` nullable guards — use `!` only when guarded by `canGenerate` check
- `onImageGenerated` optional chaining — use `?.` when calling it

Commit any fixes:

```bash
git add -p
git commit -m "fix: resolve TypeScript errors in AI image generation"
```
