# AI Content Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-powered entity generation to the create form — a "Generate with AI" button swaps the form to a prompt view, calls a subscription-gated API, and populates the form with structured output for user review before saving.

**Architecture:** Multi-provider AI abstraction (`anthropic` | `openai`) selected via `AI_PROVIDER` env var. A single `/api/generate/[entityType]` route builds story context server-side and returns structured JSON. The shared `CreateScreen` gains a generate mode that replaces the form temporarily, then populates fields on success.

**Tech Stack:** `@anthropic-ai/sdk`, `openai`, Zod, Next.js App Router API routes, React Hook Form, Radix UI, Tailwind CSS, existing `rateLimit` + `requireAuth` + `verifyOwnership` middleware.

---

## Task 1: Install AI Dependencies

**Files:**

- Modify: `apps/next/package.json`

**Step 1: Install packages**

```bash
cd apps/next && pnpm add @anthropic-ai/sdk openai
```

**Step 2: Verify install**

```bash
cd apps/next && pnpm ls @anthropic-ai/sdk openai
```

Expected: both packages listed with versions.

**Step 3: Commit**

```bash
git add apps/next/package.json pnpm-lock.yaml
git commit -m "chore: install anthropic and openai AI SDKs"
```

---

## Task 2: AI Types

**Files:**

- Create: `apps/next/lib/ai/types.ts`
- Create: `apps/next/lib/ai/types.test.ts`

**Step 1: Write the test**

```typescript
// apps/next/lib/ai/types.test.ts
import { describe, it, expect } from 'vitest'
import type {
  GenerateEntityRequest,
  GenerateEntityResponse,
  AIProvider,
} from './types'

describe('AI types', () => {
  it('GenerateEntityRequest accepts valid shape', () => {
    const req: GenerateEntityRequest = {
      entityType: 'character',
      prompt: 'A brooding detective',
      storyId: 42,
    }
    expect(req.entityType).toBe('character')
    expect(req.storyId).toBe(42)
  })

  it('GenerateEntityRequest allows no storyId', () => {
    const req: GenerateEntityRequest = {
      entityType: 'location',
      prompt: 'A foggy pier',
    }
    expect(req.storyId).toBeUndefined()
  })

  it('GenerateEntityResponse has required fields', () => {
    const res: GenerateEntityResponse = {
      name: 'Detective Marsh',
      description: 'A haunted investigator.',
      attributes: [{ key: 'Age', value: '45' }],
      mentionedCharacters: [],
    }
    expect(res.name).toBe('Detective Marsh')
    expect(res.attributes).toHaveLength(1)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/ai/types.test.ts
```

Expected: FAIL — types not found.

**Step 3: Implement types**

```typescript
// apps/next/lib/ai/types.ts

export type EntityType = 'story' | 'character' | 'location' | 'timeline'

export interface GenerateEntityRequest {
  entityType: EntityType
  prompt: string
  storyId?: number
}

export interface StoryContext {
  title: string
  description: string
  characters: Array<{ name: string; description: string }>
  locations: Array<{ name: string }>
  timelines: Array<{ name: string }>
}

export interface GenerateEntityResponse {
  name: string
  description: string
  attributes: Array<{ key: string; value: string }>
  mentionedCharacters: string[]
}

export interface AIProvider {
  generate(
    request: GenerateEntityRequest,
    context: StoryContext | null,
  ): Promise<GenerateEntityResponse>
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/ai/types.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/ai/types.ts apps/next/lib/ai/types.test.ts
git commit -m "feat: add AI provider types"
```

---

## Task 3: Prompt Builders

**Files:**

- Create: `apps/next/lib/ai/prompts.ts`
- Create: `apps/next/lib/ai/prompts.test.ts`

**Step 1: Write the test**

```typescript
// apps/next/lib/ai/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserMessage } from './prompts'
import type { EntityType, StoryContext } from './types'

const mockContext: StoryContext = {
  title: 'The Lost City',
  description: 'A tale of discovery in a forgotten land.',
  characters: [{ name: 'Maya Chen', description: 'An archaeologist' }],
  locations: [{ name: 'Ruins of Elara' }],
  timelines: [{ name: 'Ancient Era' }],
}

describe('buildSystemPrompt', () => {
  it('includes entity type in prompt', () => {
    const prompt = buildSystemPrompt('character', mockContext)
    expect(prompt).toContain('CHARACTER')
  })

  it('includes story title when context provided', () => {
    const prompt = buildSystemPrompt('character', mockContext)
    expect(prompt).toContain('The Lost City')
  })

  it('includes existing character names', () => {
    const prompt = buildSystemPrompt('character', mockContext)
    expect(prompt).toContain('Maya Chen')
  })

  it('works without context', () => {
    const prompt = buildSystemPrompt('location', null)
    expect(prompt).toContain('LOCATION')
    expect(prompt).not.toContain('Story context')
  })

  it('includes JSON schema instructions', () => {
    const prompt = buildSystemPrompt('character', null)
    expect(prompt).toContain('mentionedCharacters')
    expect(prompt).toContain('attributes')
  })
})

describe('buildUserMessage', () => {
  it('returns the prompt as the user message', () => {
    const msg = buildUserMessage('A mysterious blacksmith')
    expect(msg).toBe('A mysterious blacksmith')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/ai/prompts.test.ts
```

Expected: FAIL.

**Step 3: Implement prompts**

```typescript
// apps/next/lib/ai/prompts.ts
import type { EntityType, StoryContext } from './types'

const ENTITY_LABELS: Record<EntityType, string> = {
  story: 'STORY',
  character: 'CHARACTER',
  location: 'LOCATION',
  timeline: 'TIMELINE',
}

const ENTITY_ATTRIBUTE_HINTS: Record<EntityType, string> = {
  story: 'Genre, Themes, Tone, Setting Era, Target Audience',
  character:
    'Age, Gender, Occupation, Personality, Motivation, Flaw, Backstory',
  location: 'Climate, Population, Notable Features, History, Atmosphere',
  timeline: 'Time Period, Duration, Key Events, Significance',
}

export function buildSystemPrompt(
  entityType: EntityType,
  context: StoryContext | null,
): string {
  const label = ENTITY_LABELS[entityType]
  const attributeHints = ENTITY_ATTRIBUTE_HINTS[entityType]

  const contextSection = context
    ? `
## Story Context
Story: "${context.title}" — ${context.description}
${
  context.characters.length > 0
    ? `Existing characters: ${context.characters
        .map((c) => `${c.name} (${c.description})`)
        .join(', ')}`
    : ''
}
${
  context.locations.length > 0
    ? `Existing locations: ${context.locations.map((l) => l.name).join(', ')}`
    : ''
}
${
  context.timelines.length > 0
    ? `Existing timelines: ${context.timelines.map((t) => t.name).join(', ')}`
    : ''
}
`
    : ''

  return `You are a creative writing assistant helping authors build rich story bibles.
${contextSection}
## Task
Generate a ${label} based on the user's prompt. Your output must be consistent with any story context provided above.

## Output Format
Return ONLY valid JSON matching this exact schema — no markdown, no explanation, just JSON:
{
  "name": "string (the ${label.toLowerCase()}'s name/title)",
  "description": "string (2-3 rich paragraphs)",
  "attributes": [{ "key": "string", "value": "string" }],
  "mentionedCharacters": ["string"]
}

## Attribute Guidelines
Suggested attribute keys for a ${label}: ${attributeHints}
Include 4-6 relevant attributes. Only populate mentionedCharacters with names from the existing characters list above that appear in your output — leave empty array if none.`
}

export function buildUserMessage(prompt: string): string {
  return prompt
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/ai/prompts.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/ai/prompts.ts apps/next/lib/ai/prompts.test.ts
git commit -m "feat: add AI prompt builders with entity-specific context"
```

---

## Task 4: Anthropic Provider

**Files:**

- Create: `apps/next/lib/ai/providers/anthropic.ts`
- Create: `apps/next/lib/ai/providers/anthropic.test.ts`

**Step 1: Write the test**

```typescript
// apps/next/lib/ai/providers/anthropic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnthropicProvider } from './anthropic'
import type { GenerateEntityRequest } from '../types'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              name: 'Detective Marsh',
              description: 'A weathered investigator.',
              attributes: [{ key: 'Age', value: '45' }],
              mentionedCharacters: [],
            }),
          },
        ],
      }),
    },
  })),
}))

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider

  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key', 'claude-sonnet-4-6')
  })

  it('returns structured response', async () => {
    const req: GenerateEntityRequest = {
      entityType: 'character',
      prompt: 'A brooding detective',
    }
    const result = await provider.generate(req, null)
    expect(result.name).toBe('Detective Marsh')
    expect(result.attributes).toHaveLength(1)
    expect(result.mentionedCharacters).toEqual([])
  })

  it('throws on invalid JSON response', async () => {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const mockInstance = (Anthropic as unknown as ReturnType<typeof vi.fn>).mock
      .results[0].value
    mockInstance.messages.create.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json' }],
    })

    const req: GenerateEntityRequest = {
      entityType: 'character',
      prompt: 'test',
    }
    await expect(provider.generate(req, null)).rejects.toThrow(
      'Failed to parse AI response',
    )
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/ai/providers/anthropic.test.ts
```

Expected: FAIL.

**Step 3: Implement Anthropic provider**

```typescript
// apps/next/lib/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'
import type {
  AIProvider,
  GenerateEntityRequest,
  GenerateEntityResponse,
  StoryContext,
} from '../types'
import { buildSystemPrompt, buildUserMessage } from '../prompts'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async generate(
    request: GenerateEntityRequest,
    context: StoryContext | null,
  ): Promise<GenerateEntityResponse> {
    const systemPrompt = buildSystemPrompt(request.entityType, context)
    const userMessage = buildUserMessage(request.prompt)

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Failed to parse AI response: no text content')
    }

    try {
      const parsed = JSON.parse(textContent.text) as GenerateEntityResponse
      return {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
        mentionedCharacters: Array.isArray(parsed.mentionedCharacters)
          ? parsed.mentionedCharacters
          : [],
      }
    } catch {
      throw new Error('Failed to parse AI response: invalid JSON')
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/ai/providers/anthropic.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/ai/providers/anthropic.ts apps/next/lib/ai/providers/anthropic.test.ts
git commit -m "feat: add Anthropic Claude AI provider"
```

---

## Task 5: OpenAI Provider

**Files:**

- Create: `apps/next/lib/ai/providers/openai.ts`
- Create: `apps/next/lib/ai/providers/openai.test.ts`

**Step 1: Write the test**

```typescript
// apps/next/lib/ai/providers/openai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider } from './openai'
import type { GenerateEntityRequest } from '../types'

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: 'Harbor Town',
                  description: 'A windswept coastal settlement.',
                  attributes: [{ key: 'Climate', value: 'Maritime' }],
                  mentionedCharacters: [],
                }),
              },
            },
          ],
        }),
      },
    },
  })),
}))

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider

  beforeEach(() => {
    provider = new OpenAIProvider('fake-api-key', 'gpt-4o')
  })

  it('returns structured response', async () => {
    const req: GenerateEntityRequest = {
      entityType: 'location',
      prompt: 'A windswept harbor town',
    }
    const result = await provider.generate(req, null)
    expect(result.name).toBe('Harbor Town')
    expect(result.attributes[0]?.key).toBe('Climate')
  })

  it('throws on invalid JSON response', async () => {
    const { default: OpenAI } = await import('openai')
    const mockInstance = (OpenAI as unknown as ReturnType<typeof vi.fn>).mock
      .results[0].value
    mockInstance.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json' } }],
    })

    const req: GenerateEntityRequest = {
      entityType: 'location',
      prompt: 'test',
    }
    await expect(provider.generate(req, null)).rejects.toThrow(
      'Failed to parse AI response',
    )
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/ai/providers/openai.test.ts
```

Expected: FAIL.

**Step 3: Implement OpenAI provider**

```typescript
// apps/next/lib/ai/providers/openai.ts
import OpenAI from 'openai'
import type {
  AIProvider,
  GenerateEntityRequest,
  GenerateEntityResponse,
  StoryContext,
} from '../types'
import { buildSystemPrompt, buildUserMessage } from '../prompts'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async generate(
    request: GenerateEntityRequest,
    context: StoryContext | null,
  ): Promise<GenerateEntityResponse> {
    const systemPrompt = buildSystemPrompt(request.entityType, context)
    const userMessage = buildUserMessage(request.prompt)

    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Failed to parse AI response: no content')
    }

    try {
      const parsed = JSON.parse(content) as GenerateEntityResponse
      return {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
        mentionedCharacters: Array.isArray(parsed.mentionedCharacters)
          ? parsed.mentionedCharacters
          : [],
      }
    } catch {
      throw new Error('Failed to parse AI response: invalid JSON')
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/ai/providers/openai.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/ai/providers/openai.ts apps/next/lib/ai/providers/openai.test.ts
git commit -m "feat: add OpenAI provider"
```

---

## Task 6: Provider Factory

**Files:**

- Create: `apps/next/lib/ai/provider.ts`
- Create: `apps/next/lib/ai/provider.test.ts`

**Step 1: Write the test**

```typescript
// apps/next/lib/ai/provider.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAIProvider } from './provider'

vi.mock('./providers/anthropic', () => ({
  AnthropicProvider: vi.fn().mockImplementation(() => ({ type: 'anthropic' })),
}))
vi.mock('./providers/openai', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({ type: 'openai' })),
}))

describe('getAIProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns AnthropicProvider when AI_PROVIDER=anthropic', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic')
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'claude-sonnet-4-6')
    const provider = getAIProvider()
    expect((provider as { type: string }).type).toBe('anthropic')
  })

  it('returns OpenAIProvider when AI_PROVIDER=openai', () => {
    vi.stubEnv('AI_PROVIDER', 'openai')
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'gpt-4o')
    const provider = getAIProvider()
    expect((provider as { type: string }).type).toBe('openai')
  })

  it('defaults to anthropic when AI_PROVIDER not set', () => {
    vi.stubEnv('AI_PROVIDER', '')
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', '')
    const provider = getAIProvider()
    expect((provider as { type: string }).type).toBe('anthropic')
  })

  it('throws when API key is missing', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic')
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    expect(() => getAIProvider()).toThrow('ANTHROPIC_API_KEY')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/ai/provider.test.ts
```

Expected: FAIL.

**Step 3: Implement factory**

```typescript
// apps/next/lib/ai/provider.ts
import type { AIProvider } from './types'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'

export function getAIProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER || 'anthropic'
  const model = process.env.AI_MODEL

  if (providerName === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey)
      throw new Error('OPENAI_API_KEY environment variable is required')
    return new OpenAIProvider(apiKey, model || 'gpt-4o')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  return new AnthropicProvider(apiKey, model || 'claude-sonnet-4-6')
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/ai/provider.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/ai/provider.ts apps/next/lib/ai/provider.test.ts
git commit -m "feat: add AI provider factory with env-var configuration"
```

---

## Task 7: Validation Schema for Generate Endpoint

**Files:**

- Create: `apps/next/lib/validations/generate.ts`
- Create: `apps/next/lib/validations/generate.test.ts`

**Step 1: Write the test**

```typescript
// apps/next/lib/validations/generate.test.ts
import { describe, it, expect } from 'vitest'
import { GenerateEntitySchema } from './generate'
import { z } from 'zod'

describe('GenerateEntitySchema', () => {
  it('accepts valid character request', () => {
    const result = GenerateEntitySchema.parse({
      entityType: 'character',
      prompt: 'A brooding detective',
    })
    expect(result.entityType).toBe('character')
    expect(result.storyId).toBeUndefined()
  })

  it('accepts valid request with storyId', () => {
    const result = GenerateEntitySchema.parse({
      entityType: 'location',
      prompt: 'A foggy pier',
      storyId: 42,
    })
    expect(result.storyId).toBe(42)
  })

  it('rejects invalid entityType', () => {
    expect(() =>
      GenerateEntitySchema.parse({ entityType: 'invalid', prompt: 'test' }),
    ).toThrow(z.ZodError)
  })

  it('rejects empty prompt', () => {
    expect(() =>
      GenerateEntitySchema.parse({ entityType: 'character', prompt: '' }),
    ).toThrow(z.ZodError)
  })

  it('rejects prompt over 1000 chars', () => {
    expect(() =>
      GenerateEntitySchema.parse({
        entityType: 'character',
        prompt: 'x'.repeat(1001),
      }),
    ).toThrow(z.ZodError)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/validations/generate.test.ts
```

Expected: FAIL.

**Step 3: Implement schema**

```typescript
// apps/next/lib/validations/generate.ts
import { z } from 'zod'

export const GenerateEntitySchema = z.object({
  entityType: z.enum(['story', 'character', 'location', 'timeline']),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must be 1000 characters or less')
    .trim(),
  storyId: z.number().int().positive().optional(),
})

export type GenerateEntityInput = z.infer<typeof GenerateEntitySchema>
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/validations/generate.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/validations/generate.ts apps/next/lib/validations/generate.test.ts
git commit -m "feat: add Zod validation schema for generate endpoint"
```

---

## Task 8: Context Builder (Server-side Story Context Fetching)

**Files:**

- Create: `apps/next/lib/ai/context-builder.ts`
- Create: `apps/next/lib/ai/context-builder.test.ts`

The context builder fetches story data from the database to enrich the AI prompt.

**Step 1: Write the test**

```typescript
// apps/next/lib/ai/context-builder.test.ts
import { describe, it, expect, vi } from 'vitest'
import { buildStoryContext } from './context-builder'

const mockClient = {
  query: vi.fn(),
}

describe('buildStoryContext', () => {
  it('returns null when storyId is undefined', async () => {
    const result = await buildStoryContext(mockClient as never, undefined)
    expect(result).toBeNull()
    expect(mockClient.query).not.toHaveBeenCalled()
  })

  it('returns structured context when storyId is provided', async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ title: 'The Lost City', content: 'A tale...' }],
      })
      .mockResolvedValueOnce({
        rows: [{ name: 'Maya Chen', description: 'Archaeologist' }],
      })
      .mockResolvedValueOnce({ rows: [{ name: 'Ruins of Elara' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Ancient Era' }] })

    const result = await buildStoryContext(mockClient as never, 1)
    expect(result?.title).toBe('The Lost City')
    expect(result?.characters[0]?.name).toBe('Maya Chen')
    expect(result?.locations[0]?.name).toBe('Ruins of Elara')
    expect(result?.timelines[0]?.name).toBe('Ancient Era')
  })

  it('returns null when story not found', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] })
    const result = await buildStoryContext(mockClient as never, 999)
    expect(result).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run lib/ai/context-builder.test.ts
```

Expected: FAIL.

**Step 3: Implement context builder**

```typescript
// apps/next/lib/ai/context-builder.ts
import type { PoolClient } from 'pg'
import type { StoryContext } from './types'

export async function buildStoryContext(
  client: PoolClient,
  storyId: number | undefined,
): Promise<StoryContext | null> {
  if (!storyId) return null

  const storyResult = await client.query<{ title: string; content: string }>(
    'SELECT title, content FROM stories WHERE id = $1 LIMIT 1',
    [storyId],
  )

  const story = storyResult.rows[0]
  if (!story) return null

  const [charactersResult, locationsResult, timelinesResult] =
    await Promise.all([
      client.query<{ name: string; description: string }>(
        `SELECT c.name, c.description
       FROM characters c
       JOIN story_characters sc ON sc.character_id = c.id
       WHERE sc.story_id = $1
       LIMIT 20`,
        [storyId],
      ),
      client.query<{ name: string }>(
        `SELECT l.name
       FROM locations l
       JOIN story_locations sl ON sl.location_id = l.id
       WHERE sl.story_id = $1
       LIMIT 20`,
        [storyId],
      ),
      client.query<{ name: string }>(
        `SELECT t.name
       FROM timelines t
       JOIN story_timelines st ON st.timeline_id = t.id
       WHERE st.story_id = $1
       LIMIT 20`,
        [storyId],
      ),
    ])

  return {
    title: story.title,
    description: story.content ?? '',
    characters: charactersResult.rows,
    locations: locationsResult.rows,
    timelines: timelinesResult.rows,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run lib/ai/context-builder.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/lib/ai/context-builder.ts apps/next/lib/ai/context-builder.test.ts
git commit -m "feat: add story context builder for AI prompt enrichment"
```

---

## Task 9: Generate API Route

**Files:**

- Create: `apps/next/app/api/generate/[entityType]/route.ts`
- Create: `apps/next/app/api/generate/[entityType]/route.test.ts`

**Note:** Check the subscription check pattern from `apps/next/app/api/subscription/status/route.ts` and the pool pattern from other API routes before implementing. This route must check subscription status before calling the AI.

**Step 1: Write the test**

```typescript
// apps/next/app/api/generate/[entityType]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  RateLimitConfigs: { expensive: 'expensive' },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'user-1' },
    error: null,
  }),
}))

vi.mock('@/utils/open-pool', () => ({
  default: {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [{ status: 'active' }] }),
      release: vi.fn(),
    }),
  },
}))

vi.mock('@/lib/ai/provider', () => ({
  getAIProvider: vi.fn().mockReturnValue({
    generate: vi.fn().mockResolvedValue({
      name: 'Detective Marsh',
      description: 'A haunted investigator.',
      attributes: [{ key: 'Age', value: '45' }],
      mentionedCharacters: [],
    }),
  }),
}))

vi.mock('@/lib/ai/context-builder', () => ({
  buildStoryContext: vi.fn().mockResolvedValue(null),
}))

describe('POST /api/generate/[entityType]', () => {
  let POST: (
    req: NextRequest,
    ctx: { params: Promise<{ entityType: string }> },
  ) => Promise<Response>

  beforeEach(async () => {
    const mod = await import('./route')
    POST = mod.POST
  })

  it('returns 200 with generated entity', async () => {
    const req = new NextRequest('http://localhost/api/generate/character', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'character',
        prompt: 'A brooding detective',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req, {
      params: Promise.resolve({ entityType: 'character' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Detective Marsh')
  })

  it('returns 400 for invalid entity type', async () => {
    const req = new NextRequest('http://localhost/api/generate/invalid', {
      method: 'POST',
      body: JSON.stringify({ entityType: 'invalid', prompt: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req, {
      params: Promise.resolve({ entityType: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 403 when not subscribed', async () => {
    const { default: pool } = await import('@/utils/open-pool')
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }), // no active subscription
      release: vi.fn(),
    }
    ;(pool.connect as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockClient,
    )

    const req = new NextRequest('http://localhost/api/generate/character', {
      method: 'POST',
      body: JSON.stringify({ entityType: 'character', prompt: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req, {
      params: Promise.resolve({ entityType: 'character' }),
    })
    expect(res.status).toBe(403)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/next && pnpm vitest run app/api/generate
```

Expected: FAIL.

**Step 3: Implement route**

```typescript
// apps/next/app/api/generate/[entityType]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { requireAuth } from '@/lib/auth-middleware'
import { GenerateEntitySchema } from '@/lib/validations/generate'
import { getAIProvider } from '@/lib/ai/provider'
import { buildStoryContext } from '@/lib/ai/context-builder'
import pool from '@/utils/open-pool'
import { z } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> },
) {
  // 1. Rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  // 2. Authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    // 3. Subscription gate
    const subResult = await client.query<{ status: string }>(
      `SELECT s.status FROM subscriptions s WHERE s.user_id = $1 AND s.status = 'active' LIMIT 1`,
      [user.id],
    )
    if (subResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'AI generation requires an active subscription.' },
        { status: 403 },
      )
    }

    // 4. Validate input
    const body = await request.json()
    const { entityType } = await params
    const validated = GenerateEntitySchema.parse({ ...body, entityType })

    // 5. Build story context
    const context = await buildStoryContext(client, validated.storyId)

    // 6. Generate with AI
    const provider = getAIProvider()
    const result = await provider.generate(
      {
        entityType: validated.entityType,
        prompt: validated.prompt,
        storyId: validated.storyId,
      },
      context,
    )

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'AI generation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/next && pnpm vitest run app/api/generate
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/next/app/api/generate/ apps/next/app/api/generate/[entityType]/route.ts
git commit -m "feat: add AI generate API route with subscription gate"
```

---

## Task 10: GenerateEntityForm Component

**Files:**

- Create: `packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.types.ts`
- Create: `packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.tsx`
- Create: `packages/app/features/shared/components/GenerateEntityForm/index.ts`

This is the reusable generate UI — story dropdown + prompt textarea + Generate button. Rendered inside the create form when the user clicks "Generate with AI".

**Step 1: Create types file**

```typescript
// packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.types.ts
import type {
  EntityType,
  GenerateEntityResponse,
} from '../../../../../apps/next/lib/ai/types'

export interface Story {
  id: number
  title: string
}

export interface GenerateEntityFormProps {
  entityType: EntityType
  stories?: Story[]
  defaultStoryId?: number
  isSubscribed: boolean
  onGenerated: (result: GenerateEntityResponse) => void
  onCancel: () => void
}
```

**Step 2: Implement component**

```typescript
// packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.tsx
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
import type { GenerateEntityResponse } from '../../../../../apps/next/lib/ai/types'

export function GenerateEntityForm({
  entityType,
  stories = [],
  defaultStoryId,
  isSubscribed,
  onGenerated,
  onCancel,
}: GenerateEntityFormProps) {
  const [prompt, setPrompt] = useState('')
  const [storyId, setStoryId] = useState<number | undefined>(defaultStoryId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch(`/api/generate/${entityType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, prompt: prompt.trim(), storyId }),
      })

      if (!response.ok) {
        const data = await response.json()
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
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1 text-xs">
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
            Linking a story helps the AI stay consistent with your existing world.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="generate-prompt">
          Describe the {singularLabel}
        </Label>
        <Textarea
          id="generate-prompt"
          placeholder={`e.g. "A mysterious blacksmith who knows the hero's secret"`}
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {!isSubscribed && (
        <p className="text-muted-foreground text-xs">
          AI generation requires an active subscription.{' '}
          <a href="/about/pricing" className="text-primary underline underline-offset-2">
            Upgrade
          </a>
        </p>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating || !isSubscribed}
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
```

**Step 3: Create index**

```typescript
// packages/app/features/shared/components/GenerateEntityForm/index.ts
export { GenerateEntityForm } from './GenerateEntityForm'
export type { GenerateEntityFormProps } from './GenerateEntityForm.types'
```

**Step 4: Commit**

```bash
git add packages/app/features/shared/components/GenerateEntityForm/
git commit -m "feat: add GenerateEntityForm shared component"
```

---

## Task 11: Integrate Generate Flow into CreateScreen

**Files:**

- Modify: `packages/app/features/create/screen.tsx`

This is the main integration. The `EntityForm` and `StoryForm` components gain a "Generate with AI" button that swaps to `GenerateEntityForm`. On success, the form fields are populated.

**Key changes:**

1. Import `GenerateEntityForm`
2. Add `isGenerateMode` state to `EntityForm` and `StoryForm`
3. Add `isSubscribed` prop to `CreateScreen` (fetched server-side)
4. Add "Generate with AI" button to form footer
5. On `onGenerated`, call `setValue` for each field from the result
6. Show `mentionedCharacters` suggestion chip after population

**Step 1: Read the current file**

Already read above. Full path: `packages/app/features/create/screen.tsx`

**Step 2: Implement the changes**

Replace the contents of `packages/app/features/create/screen.tsx` with:

```typescript
'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import { Button } from '@repo/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { GenerateEntityForm } from '../shared/components/GenerateEntityForm'
import type { GenerateEntityResponse } from '../../../../apps/next/lib/ai/types'

interface Story {
  id: number
  title: string
}

interface CreateScreenProps {
  listEntitiesForUser?: unknown
  params?: { slug?: string }
  stories?: Story[]
  userId?: string
  isSubscribed?: boolean
}

type EntityType = 'stories' | 'characters' | 'locations' | 'timelines'

interface StoryFormData {
  title: string
  content: string
}

interface EntityFormData {
  name: string
  description: string
  storyId?: string
}

const entityConfig: Record<
  EntityType,
  {
    title: string
    description: string
    apiEndpoint: string
    fields: 'story' | 'entity'
  }
> = {
  stories: {
    title: 'Create a New Story',
    description: 'Add a new story to your collection',
    apiEndpoint: '/api/story',
    fields: 'story',
  },
  characters: {
    title: 'Create a New Character',
    description: 'Add a new character to your story bible',
    apiEndpoint: '/api/character',
    fields: 'entity',
  },
  locations: {
    title: 'Create a New Location',
    description: 'Add a new location to your world',
    apiEndpoint: '/api/location',
    fields: 'entity',
  },
  timelines: {
    title: 'Create a New Timeline',
    description: 'Add a new timeline to track events',
    apiEndpoint: '/api/timeline',
    fields: 'entity',
  },
}

function StoryForm({
  onSubmit,
  isSubmitting,
  stories,
  isSubscribed,
}: {
  onSubmit: (data: StoryFormData) => void
  isSubmitting: boolean
  stories?: Story[]
  isSubscribed: boolean
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StoryFormData>()

  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [mentionedCharacters, setMentionedCharacters] = useState<string[]>([])

  const handleGenerated = (result: GenerateEntityResponse) => {
    setValue('title', result.name)
    setValue('content', result.description)
    setMentionedCharacters(result.mentionedCharacters)
    setIsGenerateMode(false)
  }

  if (isGenerateMode) {
    return (
      <GenerateEntityForm
        entityType="story"
        stories={stories}
        isSubscribed={isSubscribed}
        onGenerated={handleGenerated}
        onCancel={() => setIsGenerateMode(false)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsGenerateMode(true)}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          Generate with AI
        </Button>
      </div>

      {mentionedCharacters.length > 0 && (
        <div className="bg-muted rounded-md p-3 text-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            AI mentioned existing characters:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mentionedCharacters.map((name) => (
              <span
                key={name}
                className="bg-background border-border rounded border px-2 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter story title"
          {...register('title', { required: 'Title is required' })}
          aria-invalid={errors.title ? 'true' : 'false'}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          placeholder="Write your story content..."
          rows={8}
          {...register('content', { required: 'Content is required' })}
          aria-invalid={errors.content ? 'true' : 'false'}
        />
        {errors.content && (
          <p className="text-destructive text-sm">{errors.content.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Story'}
      </Button>
    </form>
  )
}

function EntityForm({
  entityType,
  onSubmit,
  isSubmitting,
  stories = [],
  isSubscribed,
}: {
  entityType: string
  onSubmit: (data: EntityFormData) => void
  isSubmitting: boolean
  stories?: Story[]
  isSubscribed: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EntityFormData>()

  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [mentionedCharacters, setMentionedCharacters] = useState<string[]>([])

  const singularName = entityType.slice(0, -1)
  const selectedStoryId = watch('storyId')
  const aiEntityType = singularName as 'character' | 'location' | 'timeline'

  const handleGenerated = (result: GenerateEntityResponse) => {
    setValue('name', result.name)
    setValue('description', result.description)
    setMentionedCharacters(result.mentionedCharacters)
    setIsGenerateMode(false)
  }

  if (isGenerateMode) {
    return (
      <GenerateEntityForm
        entityType={aiEntityType}
        stories={stories}
        defaultStoryId={selectedStoryId ? Number(selectedStoryId) : undefined}
        isSubscribed={isSubscribed}
        onGenerated={handleGenerated}
        onCancel={() => setIsGenerateMode(false)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsGenerateMode(true)}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          Generate with AI
        </Button>
      </div>

      {mentionedCharacters.length > 0 && (
        <div className="bg-muted rounded-md p-3 text-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            AI referenced existing characters:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mentionedCharacters.map((name) => (
              <span
                key={name}
                className="bg-background border-border rounded border px-2 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {stories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="storyId">Associate with Story (optional)</Label>
          <Select
            value={selectedStoryId || ''}
            onValueChange={(value) => setValue('storyId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a story..." />
            </SelectTrigger>
            <SelectContent>
              {stories.map((story) => (
                <SelectItem key={story.id} value={String(story.id)}>
                  {story.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">
            Link this {singularName} to an existing story
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder={`Enter ${singularName} name`}
          {...register('name', { required: 'Name is required' })}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder={`Describe this ${singularName}...`}
          rows={6}
          {...register('description')}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : `Create ${singularName}`}
      </Button>
    </form>
  )
}

const CreateScreen = function (props: CreateScreenProps) {
  const router = useRouter()
  const { params, stories = [], userId, isSubscribed = false } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const entityType = (params?.slug as EntityType) || 'stories'
  const config = entityConfig[entityType] || entityConfig.stories

  const handleStorySubmit = async (data: StoryFormData) => {
    setIsSubmitting(true)
    setError(null)
    setUpgradeRequired(false)
    setSuccess(null)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.upgradeRequired) setUpgradeRequired(true)
        throw new Error(errorData.error || 'Failed to create')
      }

      const createdStory = await response.json()
      setSuccess('Story created successfully! Redirecting...')
      router.refresh()

      setTimeout(() => {
        if (userId) {
          router.push(`/${userId}/stories/${createdStory.slug || createdStory.id}`)
        }
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEntitySubmit = async (data: EntityFormData) => {
    setIsSubmitting(true)
    setError(null)
    setUpgradeRequired(false)
    setSuccess(null)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.upgradeRequired) setUpgradeRequired(true)
        throw new Error(errorData.error || 'Failed to create')
      }

      const createdEntity = await response.json()
      const singularName = entityType.slice(0, -1)
      setSuccess(`${singularName.charAt(0).toUpperCase() + singularName.slice(1)} created successfully! Redirecting...`)
      router.refresh()

      setTimeout(() => {
        if (userId) {
          router.push(`/${userId}/${entityType}/${createdEntity.slug || createdEntity.id}`)
        }
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
                {upgradeRequired ? (
                  <>
                    {error}{' '}
                    <Link
                      href="/about/pricing"
                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      Subscribe to create more.
                    </Link>
                  </>
                ) : (
                  error
                )}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </div>
            )}

            {config.fields === 'story' ? (
              <StoryForm
                onSubmit={handleStorySubmit}
                isSubmitting={isSubmitting}
                stories={stories}
                isSubscribed={isSubscribed}
              />
            ) : (
              <EntityForm
                entityType={entityType}
                onSubmit={handleEntitySubmit}
                isSubmitting={isSubmitting}
                stories={stories}
                isSubscribed={isSubscribed}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default CreateScreen
```

**Step 3: Commit**

```bash
git add packages/app/features/create/screen.tsx
git commit -m "feat: integrate AI generate mode into create form"
```

---

## Task 12: Pass isSubscribed from Server to CreateScreen

**Files:**

- Modify: `apps/next/app/create/[slug]/page.tsx`
- Modify: `apps/next/app/create/page.tsx`

The server pages need to fetch subscription status and pass `isSubscribed` to `CreateScreen`.

**Step 1: Update `create/[slug]/page.tsx`**

Add a subscription check after the stories fetch:

```typescript
// After the stories fetch block, add:
let isSubscribed = false
if (userId) {
  const client = await pool.connect()
  try {
    const subResult = await client.query(
      `SELECT status FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId],
    )
    isSubscribed = subResult.rows.length > 0
  } finally {
    client.release()
  }
}

// Update the return:
return (
  <CreateScreen
    params={resolvedParams}
    listEntitiesForUser={listEntitiesForUser}
    stories={stories}
    userId={userId}
    isSubscribed={isSubscribed}
  />
)
```

**Note:** Import pool at the top: `import pool from '../../utils/open-pool'`

**Step 2: Update `create/page.tsx`** similarly (isSubscribed defaults to false for this base page since it doesn't resolve userId).

**Step 3: Commit**

```bash
git add apps/next/app/create/
git commit -m "feat: pass subscription status to create screen"
```

---

## Task 13: Update .env.example

**Files:**

- Modify: `apps/next/.env.example`

**Step 1: Add AI env vars**

Find the end of the `.env.example` file and add:

```bash
# AI Content Generation
AI_PROVIDER=anthropic          # anthropic | openai
AI_MODEL=claude-sonnet-4-6     # Model ID for the selected provider
ANTHROPIC_API_KEY=             # Required when AI_PROVIDER=anthropic
OPENAI_API_KEY=                # Required when AI_PROVIDER=openai
```

**Step 2: Commit**

```bash
git add apps/next/.env.example
git commit -m "chore: add AI provider env vars to .env.example"
```

---

## Task 14: Build Verification

**Step 1: Run TypeScript check**

```bash
cd apps/next && pnpm tsc --noEmit
```

Expected: no errors.

**Step 2: Run all new tests**

```bash
cd apps/next && pnpm vitest run lib/ai/ lib/validations/generate.test.ts app/api/generate/
```

Expected: all PASS.

**Step 3: Run full test suite**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && pnpm test
```

Expected: no regressions.

**Step 4: Build check**

```bash
cd apps/next && pnpm build
```

Expected: successful build.

**Step 5: Final commit if any lint fixes needed**

```bash
git add -A
git commit -m "chore: fix lint issues post AI generation feature"
```

---

## Summary of Files

| Action  | File                                                                                     |
| ------- | ---------------------------------------------------------------------------------------- |
| Create  | `apps/next/lib/ai/types.ts`                                                              |
| Create  | `apps/next/lib/ai/prompts.ts`                                                            |
| Create  | `apps/next/lib/ai/provider.ts`                                                           |
| Create  | `apps/next/lib/ai/context-builder.ts`                                                    |
| Create  | `apps/next/lib/ai/providers/anthropic.ts`                                                |
| Create  | `apps/next/lib/ai/providers/openai.ts`                                                   |
| Create  | `apps/next/lib/validations/generate.ts`                                                  |
| Create  | `apps/next/app/api/generate/[entityType]/route.ts`                                       |
| Create  | `packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.tsx`      |
| Create  | `packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.types.ts` |
| Create  | `packages/app/features/shared/components/GenerateEntityForm/index.ts`                    |
| Modify  | `packages/app/features/create/screen.tsx`                                                |
| Modify  | `apps/next/app/create/[slug]/page.tsx`                                                   |
| Modify  | `apps/next/app/create/page.tsx`                                                          |
| Modify  | `apps/next/.env.example`                                                                 |
| Install | `@anthropic-ai/sdk`, `openai` in `apps/next`                                             |
