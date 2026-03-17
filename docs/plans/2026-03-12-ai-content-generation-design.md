# AI Content Generation — Design Doc

**Date:** 2026-03-12
**Branch:** feat/ai-content-generation
**Status:** Approved, ready for implementation

---

## Summary

Add AI-powered entity generation to all four list/create flows (stories, characters, locations, timelines). A "Generate with AI" button inside each create form swaps to a generation view where the user types a prompt, optionally links a story for context, and receives a fully populated form to review before saving.

---

## Key Decisions

| Decision          | Choice                                | Rationale                                 |
| ----------------- | ------------------------------------- | ----------------------------------------- |
| AI Provider       | Configurable (env-var)                | Future-proof, supports Anthropic + OpenAI |
| Generation mode   | Context-aware prompt                  | Auto-injects story context server-side    |
| UI entry point    | Button inside create form             | One entry point, two modes — no new nav   |
| Output handling   | Populate form for review              | User stays in control before saving       |
| Subscription gate | Subscribers only                      | Leverages existing Stripe infrastructure  |
| Relationships     | Only if character mentioned in prompt | Intent-driven, not noisy                  |

---

## Architecture

### Provider Abstraction (`apps/next/lib/ai/`)

```
lib/ai/
  types.ts          # GenerateEntityRequest/Response interfaces
  provider.ts       # Factory: returns correct provider from env vars
  prompts.ts        # System prompt builders per entity type
  providers/
    anthropic.ts    # Claude implementation
    openai.ts       # OpenAI implementation
```

**Env vars:**

```
AI_PROVIDER=anthropic        # anthropic | openai
AI_MODEL=claude-sonnet-4-6
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### API Route

`POST /api/generate/[entityType]`

**Security:** Rate limited (`RateLimitConfigs.expensive`), auth required, subscription-gated.

**Request body:**

```json
{ "prompt": "string", "storyId": "number (optional)" }
```

**Server-side context building:**
When `storyId` is provided, fetches and injects into system prompt:

- Story title + description
- Existing character names + 1-line descriptions
- Existing location names
- Existing timeline names

**Response:**

```json
{
  "name": "string",
  "description": "string",
  "attributes": [{ "key": "string", "value": "string" }],
  "mentionedCharacters": ["string"]
}
```

`mentionedCharacters` only populated if an existing character's name appears in the AI output.

---

## UI Flow

Inside the existing create modal, a **"Generate with AI ✦"** button appears. Clicking it swaps the form content to:

```
┌─────────────────────────────────────┐
│ Create Character                    │
│ ─────────────────────────────────── │
│ ✦ Generate with AI  [← Enter manually] │
│                                     │
│ Link to story (optional)            │
│ [Dropdown: select story ▼]          │
│                                     │
│ Describe the character...           │
│ ┌─────────────────────────────────┐ │
│ │ A mysterious blacksmith who     │ │
│ │ knows John's secret             │ │
│ └─────────────────────────────────┘ │
│                                     │
│              [Generate ✦]           │
└─────────────────────────────────────┘
```

On success:

1. Generate view disappears
2. Original form fields populate with AI output (name, description, attributes)
3. If `mentionedCharacters` is non-empty, a subtle "Link to [Name]?" chip appears
4. User reviews, edits if needed, saves normally

**Pre-selection:** If the create modal is opened from within a story detail page, the story dropdown pre-selects that story.

**Subscription gate:** If user is not subscribed, Generate button is disabled with "Upgrade to use AI generation" tooltip.

---

## Shared Components & Hooks

### `useGenerateEntity` hook

`packages/app/features/shared/hooks/useGenerateEntity.ts`

Handles: loading state, error state, API call, response mapping.
Used by all four create modals.

### `GenerateEntityForm` component

`packages/app/features/shared/components/GenerateEntityForm/`

Reusable generate view: story dropdown + prompt textarea + Generate button + loading state.
Accepts `entityType`, `onGenerated(result)`, `onCancel()` callbacks.

---

## Files to Create

```
apps/next/lib/ai/types.ts
apps/next/lib/ai/provider.ts
apps/next/lib/ai/prompts.ts
apps/next/lib/ai/providers/anthropic.ts
apps/next/lib/ai/providers/openai.ts
apps/next/app/api/generate/[entityType]/route.ts
apps/next/lib/validations/generate.ts
packages/app/features/shared/hooks/useGenerateEntity.ts
packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.tsx
packages/app/features/shared/components/GenerateEntityForm/GenerateEntityForm.types.ts
packages/app/features/shared/components/GenerateEntityForm/index.ts
```

## Files to Modify

```
apps/next/.env.example                                          # Add AI env vars
packages/app/features/characters/components/CreateCharacterModal.tsx
packages/app/features/stories/components/CreateStoryModal.tsx
packages/app/features/locations/components/CreateLocationModal.tsx
packages/app/features/timelines/components/CreateTimelineModal.tsx
```

---

## System Prompt Pattern

```
You are a creative writing assistant helping build a story bible.

[If story context provided:]
Story: "{title}" — {description}
Existing characters: {name (description), ...}
Existing locations: {name, ...}
Existing timelines: {name, ...}

Generate a {ENTITY_TYPE} based on the user's prompt.
Return ONLY valid JSON matching this exact schema:
{
  "name": "string",
  "description": "string (2-3 paragraphs)",
  "attributes": [{ "key": "string", "value": "string" }],
  "mentionedCharacters": ["string"] // existing character names referenced in output, empty array if none
}
```

---

## Out of Scope (v1)

- Image generation
- Bulk generation
- Generation history / regenerate button
- Streaming responses
- Free tier usage limits (subscribers only for now)
