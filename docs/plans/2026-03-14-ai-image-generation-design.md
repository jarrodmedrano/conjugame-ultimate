# AI Image Generation for Entities

**Date:** 2026-03-14
**Status:** Approved, ready for implementation

## Overview

Add AI image generation to all entity types (character, location, story, timeline) using the user's existing OpenAI API key and DALL-E 3. Gated the same way as text generation — requires a configured OpenAI key. Available in both create and edit flows.

---

## Architecture

### New pieces

- `POST /api/generate/image` — API route using DALL-E 3
- `ImageGenerateForm` component — prompt editor + style picker
- Updates to `ImageUpload` — adds "Generate with AI" trigger

### Reused pieces

- `user_api_keys` table — reads + decrypts existing OpenAI key
- Cloudinary upload pipeline — generated image fetched and streamed to Cloudinary
- `entity_images` table — stores generated image same as manual upload
- `api_key_required` error + gate pattern — same as text generation
- `RateLimitConfigs.expensive` — 10 requests/min

### OpenAI-only constraint

Image generation requires OpenAI (DALL-E 3). If the user has only an Anthropic key configured, the generate button shows an inline message: _"Image generation requires an OpenAI API key."_ with a link to add one.

---

## API Route

**Endpoint:** `POST /api/generate/image`

### Request body (Zod-validated)

```typescript
{
  entityType: 'character' | 'location' | 'story' | 'timeline',
  entityName: string,           // max 100 chars
  entityDescription: string,    // max 5000 chars
  customPrompt: string,         // max 500 chars, required
  style?: 'sci-fi' | 'fantasy' | 'realistic' | 'noir' | 'drama' | 'comedy' | 'horror',
  entityId: string,
  isPrimary: boolean
}
```

### Handler flow

1. Rate limit — `RateLimitConfigs.expensive`
2. Authenticate user — `requireAuth`
3. Look up OpenAI key from `user_api_keys` — if missing return `{ error: 'api_key_required', provider: 'openai' }`
4. Decrypt key — `decryptApiKey`
5. Build prompt: `customPrompt` + optional style suffix (e.g. `", in a noir cinematic style"`)
6. Call DALL-E 3 — `1024x1024`, `standard` quality, `n: 1`
7. Fetch image buffer from DALL-E temporary URL
8. Upload buffer to Cloudinary — folder `story-bible`, same validation as manual upload
9. Insert into `entity_images` table
10. Return new image record

### Error responses

| Code | Condition                                                           |
| ---- | ------------------------------------------------------------------- |
| 429  | Rate limit exceeded                                                 |
| 401  | Not authenticated                                                   |
| 403  | `{ error: 'api_key_required', provider: 'openai' }` — no OpenAI key |
| 400  | Zod validation failure                                              |
| 500  | Generic — no internal details exposed                               |

---

## Components

### `ImageGenerateForm`

**Location:** `packages/app/components/ImageGenerateForm/`

**Files:**

- `ImageGenerateForm.tsx`
- `ImageGenerateForm.types.ts`
- `useImageGenerate.ts` — business logic hook
- `index.ts`

**Props:**

```typescript
interface ImageGenerateFormProps {
  entityType: EntityType
  entityName: string
  entityDescription: string
  entityId: string
  userId: string
  onGenerated: (image: EntityImage) => void
  onCancel: () => void
}
```

**UI elements:**

- Genre style pills — 7 options (Sci-Fi, Fantasy, Realistic, Noir, Drama, Comedy, Horror), none selected by default, optional
- Prompt textarea — pre-filled with `"A [entityType] named [name]. [description]"`, 3 rows, 500 char limit
- Generate button — Sparkles icon, loading spinner during generation
- Inline error handling — `api_key_required` shows OpenAI-specific message + link to profile settings
- Preview panel — shows generated image with "Use this image" and "Try again" actions

### `ImageUpload` changes

Add a second trigger button alongside the existing upload button:

```
[ ↑ Upload image ]  [ ✦ Generate with AI ]
```

- "Generate with AI" expands `ImageGenerateForm` inline
- The two modes are mutually exclusive — expanding one collapses the other
- `ImageGenerateForm` receives entity context from the parent modal/form

---

## Prompt Construction

Base prompt pre-filled from entity data:

```
A [entityType] named [entityName]. [entityDescription]
```

User edits this freely. If a style is selected, a suffix is appended server-side:

| Style     | Suffix                                                       |
| --------- | ------------------------------------------------------------ |
| Sci-Fi    | ", in a sci-fi cinematic style"                              |
| Fantasy   | ", in a fantasy illustration style"                          |
| Realistic | ", photorealistic, highly detailed"                          |
| Noir      | ", in a noir cinematic style, high contrast black and white" |
| Drama     | ", dramatic lighting, cinematic composition"                 |
| Comedy    | ", colorful, lighthearted, cartoon illustration style"       |
| Horror    | ", dark and unsettling, horror atmosphere"                   |

The user's custom prompt takes full precedence — the style is a convenience, not a constraint.

---

## Validation Schema

```typescript
// apps/next/lib/validations/generate-image.ts
export const GenerateImageSchema = z.object({
  entityType: z.enum(['character', 'location', 'story', 'timeline']),
  entityName: z.string().min(1).max(100).trim(),
  entityDescription: z.string().max(5000).trim(),
  customPrompt: z.string().min(1, 'Prompt is required').max(500).trim(),
  style: z
    .enum([
      'sci-fi',
      'fantasy',
      'realistic',
      'noir',
      'drama',
      'comedy',
      'horror',
    ])
    .optional(),
  entityId: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10)),
  isPrimary: z.boolean().default(false),
})
```

---

## Security Checklist

- [x] Rate limiting — `RateLimitConfigs.expensive`
- [x] Authentication — `requireAuth`
- [x] Input validation — Zod schema
- [x] API key decryption at runtime only
- [x] No hardcoded secrets
- [x] Generic 500 error messages
- [x] No sensitive data in logs
- [x] Cloudinary upload reuses existing validated pipeline

---

## Files to Create / Modify

### Create

- `apps/next/app/api/generate/image/route.ts`
- `apps/next/lib/validations/generate-image.ts`
- `packages/app/components/ImageGenerateForm/ImageGenerateForm.tsx`
- `packages/app/components/ImageGenerateForm/ImageGenerateForm.types.ts`
- `packages/app/components/ImageGenerateForm/useImageGenerate.ts`
- `packages/app/components/ImageGenerateForm/index.ts`

### Modify

- `packages/app/components/ImageUpload/ImageUpload.tsx` — add Generate with AI button + integrate `ImageGenerateForm`
- `packages/app/components/ImageUpload/ImageUpload.types.ts` — add entity context props
