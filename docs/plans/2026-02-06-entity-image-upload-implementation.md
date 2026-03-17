# Entity Image Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add picture upload functionality (primary + gallery images) to stories, timelines, characters, and locations using Cloudinary storage.

**Architecture:** New `entity_images` table stores metadata, Cloudinary hosts files. Reusable `ImageUpload` component with dropzone UI. Images optional, max 2MB/1200px, JPG/PNG only.

**Tech Stack:** PostgreSQL, sqlc, Cloudinary SDK, Next.js 14 App Router, React, Tailwind CSS

---

## Phase 1: Database Schema & Migrations

### Task 1.1: Create entity_images Table Migration

**Files:**

- Create: `apps/database/migration/004_create_entity_images.sql`

**Step 1: Write migration file**

Create migration with table, indexes, and unique constraint:

```sql
-- Migration: Create entity_images table
-- Created: 2026-02-06

CREATE TABLE entity_images (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('story', 'character', 'location', 'timeline')),
    entity_id INTEGER NOT NULL,
    cloudinary_public_id TEXT NOT NULL,
    cloudinary_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    file_name VARCHAR(255),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by entity
CREATE INDEX idx_entity_images_lookup ON entity_images(entity_type, entity_id);

-- Index for filtering primary images
CREATE INDEX idx_entity_images_primary ON entity_images(entity_type, entity_id, is_primary);

-- Constraint: Only one primary image per entity
CREATE UNIQUE INDEX idx_entity_images_one_primary
    ON entity_images(entity_type, entity_id)
    WHERE is_primary = TRUE;

-- Add helpful comment
COMMENT ON TABLE entity_images IS 'Stores image metadata for all entity types (stories, characters, locations, timelines)';
COMMENT ON COLUMN entity_images.cloudinary_public_id IS 'Cloudinary public ID for deletion operations';
COMMENT ON COLUMN entity_images.display_order IS 'Order for gallery images (0 is first)';
```

**Step 2: Update schema.sql**

Add table definition to main schema:

Run: `cat apps/database/migration/004_create_entity_images.sql >> apps/database/schemas/schema.sql`

**Step 3: Commit migration**

```bash
git add apps/database/migration/004_create_entity_images.sql apps/database/schemas/schema.sql
git commit -m "feat(db): add entity_images table for image upload feature"
```

---

### Task 1.2: Create sqlc Queries for Entity Images

**Files:**

- Create: `apps/database/queries/entity_images.sql`

**Step 1: Write sqlc queries**

Create query file with all CRUD operations:

```sql
-- name: GetEntityImages :many
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2
ORDER BY is_primary DESC, display_order ASC;

-- name: GetPrimaryImage :one
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE
LIMIT 1;

-- name: GetGalleryImages :many
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE
ORDER BY display_order ASC;

-- name: CreateEntityImage :one
INSERT INTO entity_images (
  entity_type,
  entity_id,
  cloudinary_public_id,
  cloudinary_url,
  is_primary,
  display_order,
  file_name,
  file_size,
  width,
  height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: DeleteEntityImage :one
DELETE FROM entity_images
WHERE id = $1
RETURNING cloudinary_public_id;

-- name: SetPrimaryImage :exec
UPDATE entity_images
SET is_primary = (id = $2), updated_at = NOW()
WHERE entity_type = $1 AND entity_id = $3;

-- name: UpdateImageOrder :exec
UPDATE entity_images
SET display_order = $2, updated_at = NOW()
WHERE id = $1;

-- name: CountEntityImages :one
SELECT COUNT(*) FROM entity_images
WHERE entity_type = $1 AND entity_id = $2;

-- name: CountGalleryImages :one
SELECT COUNT(*) FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE;
```

**Step 2: Generate TypeScript from sqlc**

Run: `cd apps/database && make sqlc`
Expected: New file `apps/database/sqlc/entity_images_sql.ts` generated

**Step 3: Verify generated types**

Check that file exports functions like `GetEntityImages`, `CreateEntityImage`, etc.

Run: `cat apps/database/sqlc/entity_images_sql.ts | head -30`

**Step 4: Commit queries**

```bash
git add apps/database/queries/entity_images.sql apps/database/sqlc/entity_images_sql.ts
git commit -m "feat(db): add sqlc queries for entity images"
```

---

## Phase 2: Cloudinary Setup & API Endpoints

### Task 2.1: Install Cloudinary Dependencies

**Files:**

- Modify: `apps/next/package.json`

**Step 1: Install packages**

Run: `cd apps/next && pnpm add cloudinary next-cloudinary`
Expected: Packages installed, `package.json` and `pnpm-lock.yaml` updated

**Step 2: Verify installation**

Run: `cd apps/next && pnpm list cloudinary next-cloudinary`
Expected: Shows installed versions

**Step 3: Commit dependencies**

```bash
git add apps/next/package.json pnpm-lock.yaml
git commit -m "chore: add Cloudinary dependencies"
```

---

### Task 2.2: Add Cloudinary Environment Variables

**Files:**

- Modify: `apps/next/.env.example`
- Create: `.env.local` (not committed)

**Step 1: Update .env.example**

Add Cloudinary configuration template:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=story_bible_images
```

**Step 2: Create .env.local**

Developer creates their own `.env.local` with real credentials (not committed to git).

**Step 3: Commit example file**

```bash
git add apps/next/.env.example
git commit -m "chore: add Cloudinary env vars to example"
```

---

### Task 2.3: Create Cloudinary Configuration Module

**Files:**

- Create: `apps/next/lib/cloudinary.ts`

**Step 1: Write test for Cloudinary config**

Create test file:

```typescript
// apps/next/lib/cloudinary.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Cloudinary Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws error if CLOUDINARY_CLOUD_NAME is missing', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME

    expect(() => {
      require('./cloudinary')
    }).toThrow('CLOUDINARY_CLOUD_NAME')
  })

  it('throws error if CLOUDINARY_API_KEY is missing', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test'
    delete process.env.CLOUDINARY_API_KEY

    expect(() => {
      require('./cloudinary')
    }).toThrow('CLOUDINARY_API_KEY')
  })

  it('throws error if CLOUDINARY_API_SECRET is missing', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test'
    process.env.CLOUDINARY_API_KEY = 'test'
    delete process.env.CLOUDINARY_API_SECRET

    expect(() => {
      require('./cloudinary')
    }).toThrow('CLOUDINARY_API_SECRET')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm test lib/cloudinary.test.ts`
Expected: FAIL - module doesn't exist

**Step 3: Write Cloudinary config**

```typescript
// apps/next/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required')
}

if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error('CLOUDINARY_API_KEY environment variable is required')
}

if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error('CLOUDINARY_API_SECRET environment variable is required')
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export const CLOUDINARY_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_DIMENSIONS: 1200,
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png'],
  MAX_GALLERY_SIZE: 6,
  FOLDER: 'story-bible',
} as const
```

**Step 4: Run test to verify it passes**

Run: `cd apps/next && pnpm test lib/cloudinary.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/next/lib/cloudinary.ts apps/next/lib/cloudinary.test.ts
git commit -m "feat: add Cloudinary configuration module"
```

---

### Task 2.4: Create Image Upload Validation Utility

**Files:**

- Create: `apps/next/lib/validate-image.ts`
- Create: `apps/next/lib/validate-image.test.ts`

**Step 1: Write test for validation**

```typescript
// apps/next/lib/validate-image.test.ts
import { describe, it, expect } from 'vitest'
import { validateImageFile } from './validate-image'

describe('validateImageFile', () => {
  it('rejects non-image files', () => {
    const result = validateImageFile({
      type: 'text/plain',
      size: 1000,
    } as File)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('JPG and PNG')
  })

  it('rejects GIF files', () => {
    const result = validateImageFile({
      type: 'image/gif',
      size: 1000,
    } as File)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('JPG and PNG')
  })

  it('rejects files over 2MB', () => {
    const result = validateImageFile({
      type: 'image/jpeg',
      size: 3 * 1024 * 1024, // 3MB
    } as File)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('2MB')
  })

  it('accepts valid JPEG under 2MB', () => {
    const result = validateImageFile({
      type: 'image/jpeg',
      size: 1 * 1024 * 1024, // 1MB
    } as File)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts valid PNG under 2MB', () => {
    const result = validateImageFile({
      type: 'image/png',
      size: 500 * 1024, // 500KB
    } as File)

    expect(result.valid).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm test lib/validate-image.test.ts`
Expected: FAIL

**Step 3: Write validation utility**

```typescript
// apps/next/lib/validate-image.ts
import { CLOUDINARY_CONFIG } from './cloudinary'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImageFile(file: File): ValidationResult {
  // Check file type
  const allowedTypes = CLOUDINARY_CONFIG.ALLOWED_FORMATS.map(
    (format) => `image/${format === 'jpg' ? 'jpeg' : format}`,
  )

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPG and PNG files are allowed',
    }
  }

  // Check file size
  if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = CLOUDINARY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
    return {
      valid: false,
      error: `File size must be under ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

export async function validateImageDimensions(
  file: File,
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(img.src)

      if (
        img.width > CLOUDINARY_CONFIG.MAX_DIMENSIONS ||
        img.height > CLOUDINARY_CONFIG.MAX_DIMENSIONS
      ) {
        resolve({
          valid: false,
          error: `Image dimensions must be ${CLOUDINARY_CONFIG.MAX_DIMENSIONS}x${CLOUDINARY_CONFIG.MAX_DIMENSIONS}px or smaller`,
        })
      } else {
        resolve({ valid: true })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve({
        valid: false,
        error: 'Could not read image file',
      })
    }

    img.src = URL.createObjectURL(file)
  })
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/next && pnpm test lib/validate-image.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/next/lib/validate-image.ts apps/next/lib/validate-image.test.ts
git commit -m "feat: add image validation utilities"
```

---

### Task 2.5: Create Upload Image API Endpoint

**Files:**

- Create: `apps/next/app/api/upload/image/route.ts`
- Create: `apps/next/app/api/upload/image/route.test.ts`

**Step 1: Write test for upload endpoint**

```typescript
// apps/next/app/api/upload/image/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

describe('POST /api/upload/image', () => {
  it('returns 400 if no file provided', async () => {
    const formData = new FormData()
    const request = new Request('http://localhost/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('file')
  })

  it('returns 400 if file is too large', async () => {
    const largeFile = new File(
      [new ArrayBuffer(3 * 1024 * 1024)],
      'large.jpg',
      { type: 'image/jpeg' },
    )
    const formData = new FormData()
    formData.append('file', largeFile)
    formData.append('entityType', 'story')
    formData.append('entityId', '1')

    const request = new Request('http://localhost/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('2MB')
  })

  it('returns 400 if invalid file type', async () => {
    const gifFile = new File([''], 'test.gif', { type: 'image/gif' })
    const formData = new FormData()
    formData.append('file', gifFile)
    formData.append('entityType', 'story')
    formData.append('entityId', '1')

    const request = new Request('http://localhost/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('JPG and PNG')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm test app/api/upload/image/route.test.ts`
Expected: FAIL

**Step 3: Write upload endpoint**

```typescript
// apps/next/app/api/upload/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cloudinary, CLOUDINARY_CONFIG } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/validate-image'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateEntityImage } from 'database'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = parseInt(formData.get('entityId') as string, 10)
    const isPrimary = formData.get('isPrimary') === 'true'
    const displayOrder = parseInt(
      (formData.get('displayOrder') as string) || '0',
      10,
    )

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!['story', 'character', 'location', 'timeline'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 },
      )
    }

    if (isNaN(entityId)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check gallery limit if not primary
    if (!isPrimary) {
      const { rows } = await db.query(
        'SELECT COUNT(*) FROM entity_images WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE',
        [entityType, entityId],
      )
      const count = parseInt(rows[0].count, 10)

      if (count >= CLOUDINARY_CONFIG.MAX_GALLERY_SIZE) {
        return NextResponse.json(
          {
            error: `Maximum ${CLOUDINARY_CONFIG.MAX_GALLERY_SIZE} gallery images allowed`,
          },
          { status: 400 },
        )
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: CLOUDINARY_CONFIG.FOLDER,
            resource_type: 'image',
            allowed_formats: CLOUDINARY_CONFIG.ALLOWED_FORMATS,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })

    const cloudinaryResult = uploadResult as any

    // Validate dimensions from Cloudinary response
    if (
      cloudinaryResult.width > CLOUDINARY_CONFIG.MAX_DIMENSIONS ||
      cloudinaryResult.height > CLOUDINARY_CONFIG.MAX_DIMENSIONS
    ) {
      // Delete uploaded image
      await cloudinary.uploader.destroy(cloudinaryResult.public_id)

      return NextResponse.json(
        {
          error: `Image dimensions must be ${CLOUDINARY_CONFIG.MAX_DIMENSIONS}x${CLOUDINARY_CONFIG.MAX_DIMENSIONS}px or smaller`,
        },
        { status: 400 },
      )
    }

    // If setting as primary, unset existing primary
    if (isPrimary) {
      await db.query(
        'UPDATE entity_images SET is_primary = FALSE WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE',
        [entityType, entityId],
      )
    }

    // Save to database
    const imageRecord = await CreateEntityImage(db, {
      entityType,
      entityId,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryUrl: cloudinaryResult.secure_url,
      isPrimary,
      displayOrder,
      fileName: file.name,
      fileSize: file.size,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
    })

    return NextResponse.json({
      success: true,
      image: imageRecord,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/next && pnpm test app/api/upload/image/route.test.ts`
Expected: PASS (with mocked Cloudinary and DB)

**Step 5: Commit**

```bash
git add apps/next/app/api/upload/image/route.ts apps/next/app/api/upload/image/route.test.ts
git commit -m "feat: add image upload API endpoint"
```

---

### Task 2.6: Create Delete Image API Endpoint

**Files:**

- Create: `apps/next/app/api/delete/image/route.ts`
- Create: `apps/next/app/api/delete/image/route.test.ts`

**Step 1: Write test for delete endpoint**

```typescript
// apps/next/app/api/delete/image/route.test.ts
import { describe, it, expect } from 'vitest'
import { DELETE } from './route'

describe('DELETE /api/delete/image', () => {
  it('returns 401 if not authenticated', async () => {
    const request = new Request('http://localhost/api/delete/image?id=1', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 if no image ID provided', async () => {
    // Mock authenticated session
    const request = new Request('http://localhost/api/delete/image', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('ID')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm test app/api/delete/image/route.test.ts`
Expected: FAIL

**Step 3: Write delete endpoint**

```typescript
// apps/next/app/api/delete/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { DeleteEntityImage } from 'database'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const imageId = parseInt(url.searchParams.get('id') || '', 10)

    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 })
    }

    // Delete from database and get Cloudinary public ID
    const deletedImage = await DeleteEntityImage(db, { id: imageId })

    if (!deletedImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(deletedImage.cloudinaryPublicId)
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion failed:', cloudinaryError)
      // Continue - database record is already deleted
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/next && pnpm test app/api/delete/image/route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/next/app/api/delete/image/route.ts apps/next/app/api/delete/image/route.test.ts
git commit -m "feat: add image delete API endpoint"
```

---

## Phase 3: Frontend Image Upload Component

### Task 3.1: Create EntityImage Type Definition

**Files:**

- Create: `packages/app/types/entity-image.ts`

**Step 1: Write type definition**

```typescript
// packages/app/types/entity-image.ts
export interface EntityImage {
  id: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean
  displayOrder: number
  fileName: string
  fileSize: number
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
}

export interface ImageUploadProps {
  existingImages: EntityImage[]
  onUpload: (file: File, isPrimary: boolean) => Promise<void>
  onDelete: (imageId: number) => Promise<void>
  onSetPrimary: (imageId: number) => Promise<void>
  maxImages?: number
  disabled?: boolean
  theme?: string
}
```

**Step 2: Export from index**

Add to `packages/app/types/index.ts`:

```typescript
export * from './entity-image'
```

**Step 3: Commit**

```bash
git add packages/app/types/entity-image.ts packages/app/types/index.ts
git commit -m "feat: add EntityImage type definitions"
```

---

### Task 3.2: Create ImageUpload Component (Primary Section)

**Files:**

- Create: `packages/app/components/ImageUpload/ImageUpload.tsx`
- Create: `packages/app/components/ImageUpload/ImageUpload.test.tsx`
- Create: `packages/app/components/ImageUpload/index.ts`

**Step 1: Write test for ImageUpload component**

```typescript
// packages/app/components/ImageUpload/ImageUpload.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageUpload } from './ImageUpload'

describe('ImageUpload Component', () => {
  it('renders primary dropzone when no primary image', () => {
    const mockOnUpload = vi.fn()
    const mockOnDelete = vi.fn()
    const mockOnSetPrimary = vi.fn()

    render(
      <ImageUpload
        existingImages={[]}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        onSetPrimary={mockOnSetPrimary}
      />,
    )

    expect(screen.getByText(/Drop primary image/i)).toBeInTheDocument()
    expect(screen.getByText(/Browse file/i)).toBeInTheDocument()
  })

  it('renders primary image thumbnail when image exists', () => {
    const mockImage = {
      id: 1,
      cloudinaryUrl: 'https://cloudinary.com/test.jpg',
      isPrimary: true,
      displayOrder: 0,
    }

    render(
      <ImageUpload
        existingImages={[mockImage as any]}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        onSetPrimary={vi.fn()}
      />,
    )

    const img = screen.getByAltText('Primary')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', mockImage.cloudinaryUrl)
  })

  it('calls onDelete when remove button clicked', () => {
    const mockOnDelete = vi.fn()
    const mockImage = {
      id: 1,
      cloudinaryUrl: 'https://cloudinary.com/test.jpg',
      isPrimary: true,
    }

    render(
      <ImageUpload
        existingImages={[mockImage as any]}
        onUpload={vi.fn()}
        onDelete={mockOnDelete}
        onSetPrimary={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText(/Remove/i))
    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm test ImageUpload.test.tsx`
Expected: FAIL

**Step 3: Write ImageUpload component (primary section only)**

```typescript
// packages/app/components/ImageUpload/ImageUpload.tsx
'use client'

import { useRef, useMemo } from 'react'
import type { ImageUploadProps, EntityImage } from '../../types/entity-image'

export function ImageUpload({
  existingImages,
  onUpload,
  onDelete,
  onSetPrimary,
  maxImages = 7,
  disabled = false,
  theme,
}: ImageUploadProps) {
  const primaryInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const primaryImage = useMemo(
    () => existingImages.find((img) => img.isPrimary),
    [existingImages],
  )

  const galleryImages = useMemo(
    () =>
      existingImages
        .filter((img) => !img.isPrimary)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [existingImages],
  )

  const handlePrimaryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    await onUpload(file, true)
    event.target.value = '' // Reset input
  }

  const handlePrimaryClick = () => {
    primaryInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* Primary Image Section */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Primary Image (Optional)</h3>

        {!primaryImage ? (
          <div className="flex w-full items-center justify-center">
            <div className="bg-neutral-secondary-medium dark:bg-neutral-secondary-dark border-default-strong dark:border-default-medium rounded-base flex h-64 w-full flex-col items-center justify-center border border-dashed">
              <div className="text-body flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  className="mb-4 h-8 w-8"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                  />
                </svg>
                <p className="text-default dark:text-default-dark mb-2 text-sm">
                  Drop primary image or click below
                </p>
                <p className="text-muted dark:text-muted-dark mb-4 text-xs">
                  Max Size: <span className="font-semibold">2MB</span> (PNG, JPG
                  only)
                </p>
                <button
                  type="button"
                  onClick={handlePrimaryClick}
                  disabled={disabled}
                  className="bg-brand hover:bg-brand-strong focus:ring-brand-medium shadow-xs rounded-base inline-flex items-center border border-transparent px-3 py-2 text-sm font-medium leading-5 text-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Browse file
                </button>
              </div>
            </div>
            <input
              ref={primaryInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handlePrimaryUpload}
              disabled={disabled}
            />
          </div>
        ) : (
          <div className="border-default dark:border-default-dark rounded-base flex items-center gap-4 border p-4">
            <img
              src={primaryImage.cloudinaryUrl}
              alt="Primary"
              className="h-24 w-24 rounded object-cover"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrimaryClick}
                disabled={disabled}
                className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onDelete(primaryImage.id)}
                disabled={disabled}
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            <input
              ref={primaryInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handlePrimaryUpload}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Gallery section will be added in next task */}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/app && pnpm test ImageUpload.test.tsx`
Expected: PASS

**Step 5: Create index export**

```typescript
// packages/app/components/ImageUpload/index.ts
export { ImageUpload } from './ImageUpload'
```

**Step 6: Commit**

```bash
git add packages/app/components/ImageUpload/
git commit -m "feat: add ImageUpload component with primary image section"
```

---

### Task 3.3: Add Gallery Section to ImageUpload Component

**Files:**

- Modify: `packages/app/components/ImageUpload/ImageUpload.tsx`
- Modify: `packages/app/components/ImageUpload/ImageUpload.test.tsx`

**Step 1: Add test for gallery section**

Add to existing test file:

```typescript
// Add to ImageUpload.test.tsx
it('renders gallery images in grid', () => {
  const mockImages = [
    { id: 2, isPrimary: false, displayOrder: 0, cloudinaryUrl: 'url1.jpg' },
    { id: 3, isPrimary: false, displayOrder: 1, cloudinaryUrl: 'url2.jpg' },
  ]

  render(
    <ImageUpload
      existingImages={mockImages as any}
      onUpload={vi.fn()}
      onDelete={vi.fn()}
      onSetPrimary={vi.fn()}
    />,
  )

  const images = screen.getAllByRole('img')
  expect(images).toHaveLength(2)
})

it('hides gallery dropzone when limit reached', () => {
  const mockImages = Array(6)
    .fill(null)
    .map((_, i) => ({
      id: i + 1,
      isPrimary: false,
      displayOrder: i,
      cloudinaryUrl: `url${i}.jpg`,
    }))

  render(
    <ImageUpload
      existingImages={mockImages as any}
      onUpload={vi.fn()}
      onDelete={vi.fn()}
      onSetPrimary={vi.fn()}
    />,
  )

  expect(screen.getByText(/Gallery full/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm test ImageUpload.test.tsx`
Expected: FAIL

**Step 3: Add gallery section to component**

Update `ImageUpload.tsx`, adding after primary section:

```typescript
// Add to ImageUpload.tsx after primary section

const handleGalleryUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const files = event.target.files
  if (!files) return

  for (let i = 0; i < files.length; i++) {
    await onUpload(files[i], false)
  }
  event.target.value = '' // Reset input
}

const handleGalleryClick = () => {
  galleryInputRef.current?.click()
}

const isGalleryFull = galleryImages.length >= 6

// Add to JSX after primary section:

{/* Gallery Section */}
<div>
  <h3 className="mb-2 text-sm font-semibold">
    Gallery Images (Optional, up to 6)
  </h3>

  {/* Existing gallery images grid */}
  {galleryImages.length > 0 && (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {galleryImages.map((img) => (
        <div
          key={img.id}
          className="group relative aspect-square overflow-hidden rounded border border-gray-200"
        >
          <img
            src={img.cloudinaryUrl}
            alt={`Gallery image ${img.displayOrder + 1}`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onSetPrimary(img.id)}
              disabled={disabled}
              className="rounded bg-white px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Set Primary
            </button>
            <button
              type="button"
              onClick={() => onDelete(img.id)}
              disabled={disabled}
              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Gallery dropzone or full message */}
  {!isGalleryFull ? (
    <div className="flex w-full items-center justify-center">
      <div className="bg-neutral-secondary-medium dark:bg-neutral-secondary-dark border-default-strong dark:border-default-medium rounded-base flex h-48 w-full flex-col items-center justify-center border border-dashed">
        <div className="text-body flex flex-col items-center justify-center pb-6 pt-5">
          <svg
            className="mb-4 h-8 w-8"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
            />
          </svg>
          <p className="text-default dark:text-default-dark mb-2 text-sm">
            Drop gallery images or click below
          </p>
          <p className="text-muted dark:text-muted-dark mb-4 text-xs">
            ({galleryImages.length}/6 images)
          </p>
          <button
            type="button"
            onClick={handleGalleryClick}
            disabled={disabled}
            className="bg-brand hover:bg-brand-strong focus:ring-brand-medium shadow-xs rounded-base inline-flex items-center border border-transparent px-3 py-2 text-sm font-medium leading-5 text-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Browse files
          </button>
        </div>
      </div>
      <input
        ref={galleryInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png"
        onChange={handleGalleryUpload}
        disabled={disabled}
        multiple
      />
    </div>
  ) : (
    <div className="text-muted dark:text-muted-dark rounded-base border-default dark:border-default-dark flex items-center justify-center border p-4 text-sm">
      Gallery full (6/6)
    </div>
  )}
</div>
```

**Step 4: Run test to verify it passes**

Run: `cd packages/app && pnpm test ImageUpload.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/app/components/ImageUpload/
git commit -m "feat: add gallery section to ImageUpload component"
```

---

## Phase 4: Form Integration

### Task 4.1: Update Story Form Data Type

**Files:**

- Modify: `packages/app/features/stories/hooks/useStoryEdit.ts`

**Step 1: Add images to StoryFormData type**

```typescript
// Update StoryFormData interface
export interface StoryFormData {
  name: string
  description: string
  content: string
  images: EntityImage[] // Add this
}
```

**Step 2: Update initial state**

```typescript
// In useStoryEdit hook, update initial state
const [formData, setFormData] = useState<StoryFormData>({
  name: story.title,
  description: story.content.substring(0, 100),
  content: story.content,
  images: [], // Add this
})
```

**Step 3: Commit**

```bash
git add packages/app/features/stories/hooks/useStoryEdit.ts
git commit -m "feat: add images field to StoryFormData type"
```

---

### Task 4.2: Add Image Handlers to Story Modal

**Files:**

- Modify: `packages/app/features/stories/components/EditStoryModal.tsx`

**Step 1: Add image upload handler**

Add to EditStoryModal component:

```typescript
const handleImageUpload = async (file: File, isPrimary: boolean) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('entityType', 'story')
  formData.append('entityId', story.id.toString())
  formData.append('isPrimary', isPrimary.toString())

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const data = await response.json()

  // Update form data with new image
  onChange('images', [...formData.images, data.image])
}

const handleImageDelete = async (imageId: number) => {
  const response = await fetch(`/api/delete/image?id=${imageId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Delete failed')
  }

  // Update form data
  onChange(
    'images',
    formData.images.filter((img) => img.id !== imageId),
  )
}

const handleSetPrimary = async (imageId: number) => {
  // Update local state
  onChange(
    'images',
    formData.images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    })),
  )
}
```

**Step 2: Add ImageUpload component to form**

Add after content field in EditStoryModal:

```typescript
import { ImageUpload } from '@/components/ImageUpload'

// In JSX, after Textarea for content:

<FormField>
  <Label htmlFor="story-images" $theme={theme}>
    Images (Optional)
  </Label>
  <ImageUpload
    existingImages={formData.images}
    onUpload={handleImageUpload}
    onDelete={handleImageDelete}
    onSetPrimary={handleSetPrimary}
    theme={theme}
    disabled={isSaving}
  />
</FormField>
```

**Step 3: Commit**

```bash
git add packages/app/features/stories/components/EditStoryModal.tsx
git commit -m "feat: integrate ImageUpload into EditStoryModal"
```

---

### Task 4.3: Fetch Images on Story Detail Load

**Files:**

- Modify: `apps/next/app/[userId]/stories/[storyId]/page.tsx`

**Step 1: Add image fetching to server component**

```typescript
// Add to page.tsx
import { GetEntityImages } from 'database'

// In the async page component:
const images = await GetEntityImages(db, {
  entityType: 'story',
  entityId: story.id,
})

// Pass to StoryDetailScreen
<StoryDetailScreen
  story={story}
  images={images}
  // ... other props
/>
```

**Step 2: Update StoryDetailScreen props**

```typescript
// In StoryDetailScreen component
interface StoryDetailScreenProps {
  story: GetStoryRow
  images: EntityImage[]
  // ... other props
}
```

**Step 3: Commit**

```bash
git add apps/next/app/[userId]/stories/[storyId]/page.tsx packages/app/features/stories/detail-screen.tsx
git commit -m "feat: fetch and pass images to StoryDetailScreen"
```

---

## Phase 5: Detail Screen Display

### Task 5.1: Add Primary Image Thumbnail to Story Detail

**Files:**

- Modify: `packages/app/features/stories/components/StoryDetail.tsx`

**Step 1: Add primary image display**

Update StoryDetail component:

```typescript
export function StoryDetail({ story, images, ...otherProps }) {
  const primaryImage = images?.find((img) => img.isPrimary)
  const galleryImages = images?.filter((img) => !img.isPrimary) || []

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{story.title}</h1>

        {primaryImage && (
          <img
            src={primaryImage.cloudinaryUrl}
            alt={story.title}
            className="mt-4 h-24 w-24 cursor-pointer rounded-lg object-cover hover:opacity-80"
            data-testid="primary-thumbnail"
          />
        )}

        <div className="prose dark:prose-invert mt-4">{story.content}</div>
      </div>

      {/* Gallery will be added in next task */}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add packages/app/features/stories/components/StoryDetail.tsx
git commit -m "feat: add primary image thumbnail to StoryDetail"
```

---

### Task 5.2: Add Gallery Sidebar to Story Detail

**Files:**

- Modify: `packages/app/features/stories/components/StoryDetail.tsx`

**Step 1: Add gallery sidebar**

Add after main content area in StoryDetail:

```typescript
{/* Sidebar gallery */}
{galleryImages.length > 0 && (
  <aside className="w-64">
    <h3 className="text-default dark:text-default-dark mb-3 text-sm font-semibold">
      Gallery
    </h3>
    <div className="grid grid-cols-2 gap-2" data-testid="gallery-grid">
      {galleryImages.map((img) => (
        <img
          key={img.id}
          src={img.cloudinaryUrl}
          alt={`Gallery image ${img.displayOrder + 1}`}
          className="aspect-square w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
          data-testid="gallery-thumbnail"
        />
      ))}
    </div>
  </aside>
)}
```

**Step 2: Commit**

```bash
git add packages/app/features/stories/components/StoryDetail.tsx
git commit -m "feat: add gallery sidebar to StoryDetail"
```

---

### Task 5.3: Replicate for Character, Location, Timeline

**Files:**

- Modify: `packages/app/features/characters/components/EditCharacterModal.tsx`
- Modify: `packages/app/features/characters/components/CharacterDetail.tsx`
- Modify: `apps/next/app/[userId]/characters/[characterId]/page.tsx`
- (Same for locations and timelines)

**Step 1: Copy image integration from Story to Character**

Follow same pattern as Tasks 4.1-4.3 and 5.1-5.2 for characters.

**Step 2: Copy image integration to Location**

Repeat for locations.

**Step 3: Copy image integration to Timeline**

Repeat for timelines.

**Step 4: Commit each entity type separately**

```bash
git add packages/app/features/characters/ apps/next/app/[userId]/characters/
git commit -m "feat: add image upload to characters"

git add packages/app/features/locations/ apps/next/app/[userId]/locations/
git commit -m "feat: add image upload to locations"

git add packages/app/features/timelines/ apps/next/app/[userId]/timelines/
git commit -m "feat: add image upload to timelines"
```

---

## Phase 6: Testing & Polish

### Task 6.1: Run All Unit Tests

**Step 1: Run test suite**

Run: `pnpm test`
Expected: All tests PASS

**Step 2: Fix any failing tests**

If tests fail, debug and fix before proceeding.

**Step 3: Check test coverage**

Run: `pnpm test:coverage`
Expected: >80% coverage for new files

---

### Task 6.2: Manual Testing in Browser

**Files:**

- None (manual testing)

**Test Checklist:**

1. Light/Dark Mode

   - Switch between themes
   - Verify dropzone colors adapt
   - Verify text contrast

2. Primary Image Upload

   - Upload valid JPG
   - Upload valid PNG
   - Try uploading GIF (should fail)
   - Try uploading >2MB file (should fail)
   - Verify thumbnail displays
   - Test "Change" button
   - Test "Remove" button

3. Gallery Upload

   - Upload multiple images
   - Verify grid display
   - Upload 6 images (hit limit)
   - Verify "Gallery full" message
   - Test "Set as Primary" on gallery image
   - Test "Remove" on gallery image

4. Form Submission

   - Create new story with images
   - Edit existing story, add images
   - Verify images persist after save

5. Detail Screen
   - Verify primary thumbnail displays
   - Verify gallery sidebar displays
   - Test responsive layout on mobile

**Step 1: Document any issues found**

Create GitHub issues for bugs.

**Step 2: Fix critical bugs**

Fix any blocking issues before final commit.

---

### Task 6.3: Final Commit & Documentation

**Files:**

- Modify: `README.md` (if applicable)

**Step 1: Update README with Cloudinary setup instructions**

Add section explaining how to configure Cloudinary environment variables.

**Step 2: Final commit**

```bash
git add .
git commit -m "docs: add Cloudinary setup instructions to README"
```

**Step 3: Push to remote**

Run: `git push origin feat/sidebar-ux-updates`

---

## Implementation Complete!

**Summary:**

- ✅ Database schema with `entity_images` table
- ✅ Cloudinary integration with upload/delete endpoints
- ✅ Reusable `ImageUpload` component with dropzone UI
- ✅ Integration into all 4 entity types (stories, characters, locations, timelines)
- ✅ Detail screens display primary thumbnail + gallery sidebar
- ✅ Comprehensive validation (file type, size, dimensions, gallery limit)
- ✅ Light/dark mode support
- ✅ Unit tests with >80% coverage

**Next Steps:**

- Create PR for review
- Deploy to staging environment
- User acceptance testing
- Deploy to production
